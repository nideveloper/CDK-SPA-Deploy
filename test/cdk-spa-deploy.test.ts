import { expect as expectCDK, haveResource, haveResourceLike } from '@aws-cdk/assert';
import { Stack, App } from '@aws-cdk/core';
import { SPADeploy } from '../lib/';

test('Cloudfront Distribution Included', () => {
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website'
    })
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      "DistributionConfig": {
          "CustomErrorResponses": [
            {
              "ErrorCode": 403,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html"
            },
            {
              "ErrorCode": 404,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html"
            }
          ],
          "DefaultCacheBehavior": {
                "ViewerProtocolPolicy": "redirect-to-https"
          },
          "DefaultRootObject": "index.html",
          "HttpVersion": "http2",
          "IPV6Enabled": true,
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
      }
    }));
    
    expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy',  {
            PolicyDocument: {
                Statement: [
                    {
                        "Action": "s3:GetObject",
                        "Effect": "Allow",
                        "Principal": "*"
                    }]
            }
    }));
});

test('Cloudfront With Custom Cert and Aliases', () => {
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      certificateARN: 'arn:1234',
      cfAliases: ['www.test.com']
    })

    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      "DistributionConfig": {
          "Aliases": [
                "www.test.com"
          ],
          "ViewerCertificate": {
            "AcmCertificateArn": "arn:1234",
            "SslSupportMethod": "sni-only"
          }
      }
    }));
});

test('Basic Site Setup', () => {
    let stack = new Stack();
    
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy');
    
    deploy.createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website'
    })
    
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy',  {
            PolicyDocument: {
                Statement: [
                    {
                        "Action": "s3:GetObject",
                        "Effect": "Allow",
                        "Principal": "*"
                    }]
            }
    }));
});

test('Basic Site Setup, Encrypted Bucket', () => {
    let stack = new Stack();
    
    // WHEN
    new SPADeploy(stack, 'spaDeploy', {encryptBucket:true})
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: 'website'
      })
    
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256"
            }
          }
        ]
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy',  {
            PolicyDocument: {
                Statement: [
                    {
                        "Action": "s3:GetObject",
                        "Effect": "Allow",
                        "Principal": "*"
                    }]
            }
    }));
});

test('Cloudfront With Encrypted Bucket', () => {
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy', {encryptBucket:true});
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      certificateARN: 'arn:1234',
      cfAliases: ['www.test.com']
    })

    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256"
            }
          }
        ]
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      "DistributionConfig": {
          "Aliases": [
                "www.test.com"
          ],
          "ViewerCertificate": {
            "AcmCertificateArn": "arn:1234",
            "SslSupportMethod": "sni-only"
          }
      }
    }));
});

test('Basic Site Setup, IP Filter', () => {
    let stack = new Stack();
    
    // WHEN
    new SPADeploy(stack, 'spaDeploy', {encryptBucket:true, ipFilter:true, ipList: ['1.1.1.1']})
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: 'website'
      })
    
    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256"
            }
          }
        ]
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy',  {
            PolicyDocument: {
                Statement: [
                    {
                        "Action": "s3:GetObject",
                        "Condition": {
                          "IpAddress": {
                            "aws:SourceIp": [
                              "1.1.1.1"
                            ]
                          }
                        },
                        "Effect": "Allow",
                        "Principal": "*"
                    }]
            }
    }));
});

test('Cloudfront With IP Filter', () => {
    let stack = new Stack();
    // WHEN
    let deploy = new SPADeploy(stack, 'spaDeploy', {encryptBucket:true, ipFilter:true, ipList: ['1.1.1.1']});
    
    deploy.createSiteWithCloudfront({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      certificateARN: 'arn:1234',
      cfAliases: ['www.test.com']
    })

    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256"
            }
          }
        ]
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy',  {
            PolicyDocument: {
                Statement: [
                    {
                        "Action": "s3:GetObject",
                        "Condition": {
                          "IpAddress": {
                            "aws:SourceIp": [
                              "1.1.1.1"
                            ]
                          }
                        },
                        "Effect": "Allow",
                        "Principal": "*"
                    }]
            }
    }));
    
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      "DistributionConfig": {
          "Aliases": [
                "www.test.com"
          ],
          "ViewerCertificate": {
            "AcmCertificateArn": "arn:1234",
            "SslSupportMethod": "sni-only"
          }
      }
    }));
});

test('Create From Hosted Zone', () => {
    let app = new App();
    let stack = new Stack(app, 'testStack', {
      env: {
        region: 'us-east-1',
        account: '1234'
        }
    });
    // WHEN
    new SPADeploy(stack, 'spaDeploy', {encryptBucket:true})
      .createSiteFromHostedZone({
        zoneName: 'cdkspadeploy.com',
        indexDoc: 'index.html',
        websiteFolder: 'website'
      });

    // THEN
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256"
            }
          }
        ]
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html'
      }
    }));
    
    expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));
    
    expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      "DistributionConfig": {
          "Aliases": [
                "www.cdkspadeploy.com"
          ],
          "ViewerCertificate": {
            "SslSupportMethod": "sni-only"
          }
      }
    }));
});
