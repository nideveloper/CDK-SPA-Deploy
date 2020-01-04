import cdk = require('@aws-cdk/core');
import s3deploy= require('@aws-cdk/aws-s3-deployment');
import s3 = require('@aws-cdk/aws-s3');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'

export interface SPADeployConfig {
  indexDoc:string,
  websiteFolder: string,
  certificateARN?: string,
  cfAliases?: string[]
}

export class SPADeploy extends cdk.Construct {
    constructor(scope: cdk.Construct, id:string){
        super(scope, id);
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
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
          websiteIndexDocument: config.indexDoc,
          publicReadAccess: true
        });
        
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
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
          websiteIndexDocument: config.indexDoc,
          publicReadAccess: true
        });
        
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