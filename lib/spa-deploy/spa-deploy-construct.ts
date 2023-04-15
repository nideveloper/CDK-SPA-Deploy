import {
  CloudFrontWebDistribution,
  ViewerCertificate,
  OriginAccessIdentity,
  Behavior,
  SSLMethod,
  SecurityPolicyProtocol,
} from 'aws-cdk-lib/aws-cloudfront';
import { PolicyStatement, Role, AnyPrincipal, Effect } from 'aws-cdk-lib/aws-iam';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HttpsRedirect } from 'aws-cdk-lib/aws-route53-patterns';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { CfnOutput } from 'aws-cdk-lib';
import s3deploy= require('aws-cdk-lib/aws-s3-deployment');
import s3 = require('aws-cdk-lib/aws-s3');
import { Construct } from 'constructs';

export interface SPADeployConfig {
  readonly indexDoc:string,
  readonly errorDoc?:string,
  readonly websiteFolder: string,
  readonly certificateARN?: string,
  readonly cfBehaviors?: Behavior[],
  readonly cfAliases?: string[],
  readonly exportWebsiteUrlOutput?:boolean,
  readonly exportWebsiteUrlName?: string,
  readonly blockPublicAccess?:s3.BlockPublicAccess
  readonly sslMethod?: SSLMethod,
  readonly securityPolicy?: SecurityPolicyProtocol,
  readonly memoryLimit?: number
  readonly role?:Role,
}

export interface HostedZoneConfig {
  readonly indexDoc:string,
  readonly errorDoc?:string,
  readonly cfBehaviors?: Behavior[],
  readonly websiteFolder: string,
  readonly zoneName: string,
  readonly subdomain?: string,
  readonly memoryLimit?: number
  readonly role?: Role,
}

export interface SPAGlobalConfig {
  readonly encryptBucket?:boolean,
  readonly ipFilter?:boolean,
  readonly ipList?:string[],
  readonly role?:Role,
}

export interface SPADeployment {
  readonly websiteBucket: s3.Bucket,
}

export interface SPADeploymentWithCloudFront extends SPADeployment {
  readonly distribution: CloudFrontWebDistribution,
}

export class SPADeploy extends Construct {
    globalConfig: SPAGlobalConfig;

    constructor(scope: Construct, id:string, config?:SPAGlobalConfig) {
      super(scope, id);

      if (typeof config !== 'undefined') {
        this.globalConfig = config;
      } else {
        this.globalConfig = {
          encryptBucket: false,
          ipFilter: false,
        };
      }
    }

    /**
     * Helper method to provide a configured s3 bucket
     */
    private getS3Bucket(config:SPADeployConfig, isForCloudFront: boolean) {
      const bucketConfig:any = {
        websiteIndexDocument: config.indexDoc,
        websiteErrorDocument: config.errorDoc,
        publicReadAccess: true,
      };

      if (this.globalConfig.encryptBucket === true) {
        bucketConfig.encryption = s3.BucketEncryption.S3_MANAGED;
      }

      if (this.globalConfig.ipFilter === true || isForCloudFront === true || typeof config.blockPublicAccess !== 'undefined') {
        bucketConfig.publicReadAccess = false;
        if (typeof config.blockPublicAccess !== 'undefined') {
          bucketConfig.blockPublicAccess = config.blockPublicAccess;
        }
      }

      const bucket = new s3.Bucket(this, 'WebsiteBucket', bucketConfig);

      if (this.globalConfig.ipFilter === true && isForCloudFront === false) {
        if (typeof this.globalConfig.ipList === 'undefined') {
          throw new Error('When IP Filter is true then the IP List is required');
        }

        const bucketPolicy = new PolicyStatement();
        bucketPolicy.addAnyPrincipal();
        bucketPolicy.addActions('s3:GetObject');
        bucketPolicy.addResources(`${bucket.bucketArn}/*`);
        bucketPolicy.addCondition('IpAddress', {
          'aws:SourceIp': this.globalConfig.ipList,
        });

        bucket.addToResourcePolicy(bucketPolicy);
      }

      //The below "reinforces" the IAM Role's attached policy, it's not required but it allows for customers using permission boundaries to write into the bucket.
      if (config.role) {
        bucket.addToResourcePolicy(
            new PolicyStatement({
              actions: [
                "s3:GetObject*",
                "s3:GetBucket*",
                "s3:List*",
                "s3:DeleteObject*",
                "s3:PutObject*",
                "s3:Abort*"
              ],
              effect: Effect.ALLOW,
              resources: [bucket.arnForObjects('*'), bucket.bucketArn],
              conditions: {
                StringEquals: {
                  'aws:PrincipalArn': config.role.roleArn,
                },
              },
              principals: [new AnyPrincipal()]
            })
        );
      }

      return bucket;
    }

    /**
     * Helper method to provide configuration for cloudfront
     */
    private getCFConfig(websiteBucket:s3.Bucket, config:any, accessIdentity: OriginAccessIdentity, cert?:DnsValidatedCertificate) {
      const cfConfig:any = {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
              originAccessIdentity: accessIdentity,
            },
            behaviors: config.cfBehaviors ? config.cfBehaviors : [{ isDefaultBehavior: true }],
          },
        ],
        // We need to redirect all unknown routes back to index.html for angular routing to work
        errorConfigurations: [{
          errorCode: 403,
          responsePagePath: (config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`),
          responseCode: 200,
        },
        {
          errorCode: 404,
          responsePagePath: (config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`),
          responseCode: 200,
        }],
      };

      if (typeof config.certificateARN !== 'undefined' && typeof config.cfAliases !== 'undefined') {
        cfConfig.aliasConfiguration = {
          acmCertRef: config.certificateARN,
          names: config.cfAliases,
        };
      }
      if (typeof config.sslMethod !== 'undefined') {
        cfConfig.aliasConfiguration.sslMethod = config.sslMethod;
      }

      if (typeof config.securityPolicy !== 'undefined') {
        cfConfig.aliasConfiguration.securityPolicy = config.securityPolicy;
      }

      if (typeof config.zoneName !== 'undefined' && typeof cert !== 'undefined') {
        cfConfig.viewerCertificate = ViewerCertificate.fromAcmCertificate(cert, {
          aliases: [config.subdomain ? `${config.subdomain}.${config.zoneName}` : config.zoneName],
        });
      }

      return cfConfig;
    }

    /**
     * Basic setup needed for a non-ssl, non vanity url, non cached s3 website
     */
    public createBasicSite(config:SPADeployConfig): SPADeployment {
      const websiteBucket = this.getS3Bucket(config, false);

      new s3deploy.BucketDeployment(this, 'BucketDeployment', {
        sources: [s3deploy.Source.asset(config.websiteFolder)],
        role: config.role,
        destinationBucket: websiteBucket,
        memoryLimit: config.memoryLimit
      });

      const cfnOutputConfig:any = {
        description: 'The url of the website',
        value: websiteBucket.bucketWebsiteUrl,
      };

      if (config.exportWebsiteUrlOutput === true) {
        if (typeof config.exportWebsiteUrlName === 'undefined' || config.exportWebsiteUrlName === '') {
          throw new Error('When Output URL as AWS Export property is true then the output name is required');
        }
        cfnOutputConfig.exportName = config.exportWebsiteUrlName;
      }

      let output = new CfnOutput(this, 'URL', cfnOutputConfig);
      //set the output name to be the same as the export name
      if(typeof config.exportWebsiteUrlName !== 'undefined' && config.exportWebsiteUrlName !== ''){
        output.overrideLogicalId(config.exportWebsiteUrlName);
      }

      return { websiteBucket };
    }

    /**
     * This will create an s3 deployment fronted by a cloudfront distribution
     * It will also setup error forwarding and unauth forwarding back to indexDoc
     */
    public createSiteWithCloudfront(config:SPADeployConfig): SPADeploymentWithCloudFront {
      const websiteBucket = this.getS3Bucket(config, true);
      const accessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity', { comment: `${websiteBucket.bucketName}-access-identity` });
      const distribution = new CloudFrontWebDistribution(this, 'cloudfrontDistribution', this.getCFConfig(websiteBucket, config, accessIdentity));

      new s3deploy.BucketDeployment(this, 'BucketDeployment', {
        sources: [s3deploy.Source.asset(config.websiteFolder)],
        destinationBucket: websiteBucket,
        // Invalidate the cache for / and index.html when we deploy so that cloudfront serves latest site
        distribution,
        distributionPaths: ['/', `/${config.indexDoc}`],
        memoryLimit: config.memoryLimit
        role: config.role,
      });

      new CfnOutput(this, 'cloudfront domain', {
        description: 'The domain of the website',
        value: distribution.distributionDomainName,
      });

      return { websiteBucket, distribution };
    }

    /**
     * S3 Deployment, cloudfront distribution, ssl cert and error forwarding auto
     * configured by using the details in the hosted zone provided
     */
    public createSiteFromHostedZone(config:HostedZoneConfig): SPADeploymentWithCloudFront {
      const websiteBucket = this.getS3Bucket(config, true);
      const zone = HostedZone.fromLookup(this, 'HostedZone', { domainName: config.zoneName });
      const domainName = config.subdomain ? `${config.subdomain}.${config.zoneName}` : config.zoneName;
      const cert = new DnsValidatedCertificate(this, 'Certificate', {
        hostedZone: zone,
        domainName,
        region: 'us-east-1',
      });

      const accessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity', { comment: `${websiteBucket.bucketName}-access-identity` });
      const distribution = new CloudFrontWebDistribution(this, 'cloudfrontDistribution', this.getCFConfig(websiteBucket, config, accessIdentity, cert));

      new s3deploy.BucketDeployment(this, 'BucketDeployment', {
        sources: [s3deploy.Source.asset(config.websiteFolder)],
        destinationBucket: websiteBucket,
        // Invalidate the cache for / and index.html when we deploy so that cloudfront serves latest site
        distribution,
        role: config.role,
        distributionPaths: ['/', `/${config.indexDoc}`],
        memoryLimit: config.memoryLimit
      });

      new ARecord(this, 'Alias', {
        zone,
        recordName: domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      });

      if (!config.subdomain) {
        new HttpsRedirect(this, 'Redirect', {
            zone,
            recordNames: [`www.${config.zoneName}`],
            targetDomain: config.zoneName,
        });          
      }

      return { websiteBucket, distribution };
    }
}
