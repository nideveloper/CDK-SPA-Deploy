import cdk = require('@aws-cdk/core');
import s3deploy= require('@aws-cdk/aws-s3-deployment');
import s3 = require('@aws-cdk/aws-s3');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'

export class CdkSpaDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, 'BlogBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true
    });
    
    websiteBucket.grantPublicAccess('*', 's3:GetObject');
    
    const distribution = new CloudFrontWebDistribution(this, 'cdk-example-cfront', {
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
        responsePagePath: '/index.html',
        responseCode: 200
      },
      {
        errorCode: 404,
        responsePagePath: '/index.html',
        responseCode: 200
      }],
      aliasConfiguration: {
        acmCertRef: 'arn:aws:acm:us-east-1:883728077172:certificate/5cd35ee9-4d34-47f6-8875-b38f73a9acc7',
        names: ['www.mattcoulter.com', 'mattcoulter.com', 'www.matt-coulter.com', 'matt-coulter.com']
      }
    });
    
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../blog/dist/blog')], 
      destinationBucket: websiteBucket,
      //Invalidate the cache for / and index.html when we deploy so that cloudfront serves latest site
      distribution: distribution,
      distributionPaths: ['/', '/index.html']
      //distributionPaths: ['/', '/index.html', '/assets/posts/*']
    });
    
    new cdk.CfnOutput(this, 'URL', {
      description: 'The url of the website',
      value: websiteBucket.bucketWebsiteUrl
    })
  }
}
