import cdk = require('@aws-cdk/core');
import s3deploy= require('@aws-cdk/aws-s3-deployment');
import s3 = require('@aws-cdk/aws-s3');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import { PolicyStatement } from '@aws-cdk/aws-iam';

export interface SPADeployConfig {
  readonly indexDoc:string,
  readonly websiteFolder: string,
  readonly certificateARN?: string,
  readonly cfAliases?: string[]
}

export interface SPAGlobalConfig {
  readonly encryptBucket?:boolean,
  readonly ipFilter?:boolean,
  readonly ipList?:string[]
}

export class SPADeploy extends cdk.Construct {
    globalConfig: SPAGlobalConfig;
    
    constructor(scope: cdk.Construct, id:string, config?:SPAGlobalConfig){
        super(scope, id);
        
        if(typeof config != 'undefined'){
          this.globalConfig = config;
        } else {
          this.globalConfig = {
            encryptBucket:false,
            ipFilter: false
          }
        }
    }
    
    private getS3Bucket(config:SPADeployConfig) {
      
      let bucketConfig:any = {
          websiteIndexDocument: config.indexDoc,
          publicReadAccess: true
        };
        
      if(this.globalConfig.encryptBucket === true){
        bucketConfig.encryption = s3.BucketEncryption.S3_MANAGED
      }
      
      if(this.globalConfig.ipFilter === true){
        bucketConfig.publicReadAccess = false;
      }
        
      let bucket = new s3.Bucket(this, 'WebsiteBucket', bucketConfig);
      
      if(this.globalConfig.ipFilter === true){
        if(typeof this.globalConfig.ipList == 'undefined') {
          this.node.addError('When IP Filter is true then the IP List is required');
        }
        
        const bucketPolicy = new PolicyStatement();
        bucketPolicy.addAnyPrincipal();
        bucketPolicy.addActions('s3:GetObject');
        bucketPolicy.addResources(bucket.bucketArn + '/*');
        bucketPolicy.addCondition('IpAddress', {
          'aws:SourceIp': this.globalConfig.ipList
        });
        
        bucket.addToResourcePolicy(bucketPolicy);
      }
      
      return bucket;
    }
    
    private getCFConfig(websiteBucket:s3.Bucket, config:SPADeployConfig) {
         let cfConfig:any = {
          originConfigs: [
            {
              s3OriginSource: {
                s3BucketSource: websiteBucket
              },
              behaviors : [ {isDefaultBehavior: true}]
            }
          ],
          //We need to redirect all unknown routes back to index.html for angular routing to work
          errorConfigurations: [{
            errorCode: 403,
            responsePagePath: '/'+config.indexDoc,
            responseCode: 200
          },
          {
            errorCode: 404,
            responsePagePath: '/'+config.indexDoc,
            responseCode: 200
          }]
        }
        
        if(typeof config.certificateARN != 'undefined' && typeof config.cfAliases != 'undefined') {
            cfConfig.aliasConfiguration = {
                acmCertRef: config.certificateARN,
                names: config.cfAliases
            }
        }
        
        return cfConfig;
    }
    
    /**
     * This will create an s3 deployment fronted by a cloudfront distribution
     * It will also setup error forwarding and unauth forwarding back to indexDoc
     */
    public createSiteWithCloudfront(config:SPADeployConfig) {
        const websiteBucket = this.getS3Bucket(config);
        const distribution = new CloudFrontWebDistribution(this, 'cloudfrontDistribution', this.getCFConfig(websiteBucket, config));
        
        new s3deploy.BucketDeployment(this, 'BucketDeployment', {
          sources: [s3deploy.Source.asset(config.websiteFolder)], 
          destinationBucket: websiteBucket,
          //Invalidate the cache for / and index.html when we deploy so that cloudfront serves latest site
          distribution: distribution,
          distributionPaths: ['/', '/'+config.indexDoc]
        });
        
        new cdk.CfnOutput(this, 'cloudfront domain', {
          description: 'The domain of the website',
          value: distribution.domainName
        })
    }
    
    /**
     * Basic setup needed for a non-ssl, non vanity url, non cached s3 website
     */
    public createBasicSite(config:SPADeployConfig) {
        const websiteBucket = this.getS3Bucket(config);
        
        new s3deploy.BucketDeployment(this, 'BucketDeployment', {
          sources: [s3deploy.Source.asset(config.websiteFolder)], 
          destinationBucket: websiteBucket,
        });
        
        new cdk.CfnOutput(this, 'URL', {
          description: 'The url of the website',
          value: websiteBucket.bucketWebsiteUrl
        })
    }
    
}