import {
  expect as expectCDK, haveResource, haveResourceLike, haveOutput,
} from '@aws-cdk/assert';
import * as cf from '@aws-cdk/aws-cloudfront';
import { Stack, App } from '@aws-cdk/core';
import { SPADeploy } from '../lib';

test('Cloudfront Distribution Included', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
  });
  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      CustomErrorResponses: [
        {
          ErrorCode: 403,
          ResponseCode: 200,
          ResponsePagePath: '/index.html',
        },
        {
          ErrorCode: 404,
          ResponseCode: 200,
          ResponsePagePath: '/index.html',
        },
      ],
      DefaultCacheBehavior: {
        ViewerProtocolPolicy: 'redirect-to-https',
      },
      DefaultRootObject: 'index.html',
      HttpVersion: 'http2',
      IPV6Enabled: true,
      PriceClass: 'PriceClass_100',
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true,
      },
    },
  }));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            's3:GetObject*',
            's3:GetBucket*',
            's3:List*',
          ],
          Effect: 'Allow',
          Principal: {
            CanonicalUser: {
              'Fn::GetAtt': [
                'spaDeployOriginAccessIdentityEDA4C19C',
                'S3CanonicalUserId',
              ],
            },
          },
          Resource: [
            {
              'Fn::GetAtt': [
                'spaDeployWebsiteBucket1E4C4442',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'spaDeployWebsiteBucket1E4C4442',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        }],
    },
  }));
});

test('Cloudfront Distribution Included - with non-default error-doc cfg set', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    errorDoc: 'error.html',
    websiteFolder: 'website',
  });
  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
      ErrorDocument: 'error.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      CustomErrorResponses: [
        {
          ErrorCode: 403,
          ResponseCode: 200,
          ResponsePagePath: '/error.html',
        },
        {
          ErrorCode: 404,
          ResponseCode: 200,
          ResponsePagePath: '/error.html',
        },
      ],
      DefaultCacheBehavior: {
        ViewerProtocolPolicy: 'redirect-to-https',
      },
      DefaultRootObject: 'index.html',
      HttpVersion: 'http2',
      IPV6Enabled: true,
      PriceClass: 'PriceClass_100',
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true,
      },
    },
  }));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            's3:GetObject*',
            's3:GetBucket*',
            's3:List*',
          ],
          Effect: 'Allow',
          Principal: {
            CanonicalUser: {
              'Fn::GetAtt': [
                'spaDeployOriginAccessIdentityEDA4C19C',
                'S3CanonicalUserId',
              ],
            },
          },
          Resource: [
            {
              'Fn::GetAtt': [
                'spaDeployWebsiteBucket1E4C4442',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'spaDeployWebsiteBucket1E4C4442',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        }],
    },
  }));
});

test('Cloudfront With Custom Cert and Aliases', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.test.com',
      ],
      ViewerCertificate: {
        AcmCertificateArn: 'arn:1234',
        SslSupportMethod: 'sni-only',
      },
    },
  }));
});

test('Basic Site Setup', () => {
  const stack = new Stack();

  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createBasicSite({
    indexDoc: 'index.html',
    websiteFolder: 'website',
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 's3:GetObject',
          Effect: 'Allow',
          Principal: '*',
        }],
    },
  }));
});

test('Basic Site Setup with Error Doc set', () => {
  const stack = new Stack();

  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createBasicSite({
    indexDoc: 'index.html',
    errorDoc: 'error.html',
    websiteFolder: 'website',
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
      ErrorDocument: 'error.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 's3:GetObject',
          Effect: 'Allow',
          Principal: '*',
        }],
    },
  }));
});

test('Basic Site Setup, Encrypted Bucket', () => {
  const stack = new Stack();

  // WHEN
  new SPADeploy(stack, 'spaDeploy', { encryptBucket: true })
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
    });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 's3:GetObject',
          Effect: 'Allow',
          Principal: '*',
        }],
    },
  }));
});

test('Cloudfront With Encrypted Bucket', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy', { encryptBucket: true });

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.test.com',
      ],
      ViewerCertificate: {
        AcmCertificateArn: 'arn:1234',
        SslSupportMethod: 'sni-only',
      },
    },
  }));
});

test('Cloudfront With Custom Defined Behaviors', () => {
  const stack = new Stack();

  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    cfBehaviors: [
      {
        isDefaultBehavior: true,
        allowedMethods: cf.CloudFrontAllowedMethods.ALL,
        forwardedValues: {
          queryString: true,
          cookies: { forward: 'all' },
          headers: ['*'],
        },
      },
      {
        pathPattern: '/virtual-path',
        allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD,
        cachedMethods: cf.CloudFrontAllowedCachedMethods.GET_HEAD,
      },
    ],
  });

  // THEN
  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      CacheBehaviors: [
        {
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
          PathPattern: '/virtual-path',
        },
      ],
      DefaultCacheBehavior: {
        AllowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
        ForwardedValues: {
          Cookies: { Forward: 'all' },
          Headers: ['*'],
          QueryString: true,
        },
        TargetOriginId: 'origin1'
      },
    },
  }));
});

test('Basic Site Setup, IP Filter', () => {
  const stack = new Stack();

  // WHEN
  new SPADeploy(stack, 'spaDeploy', { encryptBucket: true, ipFilter: true, ipList: ['1.1.1.1'] })
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
    });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 's3:GetObject',
          Condition: {
            IpAddress: {
              'aws:SourceIp': [
                '1.1.1.1',
              ],
            },
          },
          Effect: 'Allow',
          Principal: '*',
        }],
    },
  }));
});

test('Create From Hosted Zone', () => {
  const app = new App();
  const stack = new Stack(app, 'testStack', {
    env: {
      region: 'us-east-1',
      account: '1234',
    },
  });
    // WHEN
  new SPADeploy(stack, 'spaDeploy', { encryptBucket: true })
    .createSiteFromHostedZone({
      zoneName: 'cdkspadeploy.com',
      indexDoc: 'index.html',
      websiteFolder: 'website',
    });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.cdkspadeploy.com',
      ],
      ViewerCertificate: {
        SslSupportMethod: 'sni-only',
      },
    },
  }));

  expectCDK(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            's3:GetObject*',
            's3:GetBucket*',
            's3:List*',
          ],
          Effect: 'Allow',
          Principal: {
            CanonicalUser: {
              'Fn::GetAtt': [
                'spaDeployOriginAccessIdentityEDA4C19C',
                'S3CanonicalUserId',
              ],
            },
          },
          Resource: [
            {
              'Fn::GetAtt': [
                'spaDeployWebsiteBucket1E4C4442',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'spaDeployWebsiteBucket1E4C4442',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        }],
    },
  }));
});

test('Create From Hosted Zone with Error Bucket', () => {
  const app = new App();
  const stack = new Stack(app, 'testStack', {
    env: {
      region: 'us-east-1',
      account: '1234',
    },
  });
  // WHEN
  new SPADeploy(stack, 'spaDeploy', { encryptBucket: true })
    .createSiteFromHostedZone({
      zoneName: 'cdkspadeploy.com',
      indexDoc: 'index.html',
      errorDoc: 'error.html',
      websiteFolder: 'website',
    });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
      ErrorDocument: 'error.html',
    },
  }));

  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.cdkspadeploy.com',
      ],
      ViewerCertificate: {
        SslSupportMethod: 'sni-only',
      },
    },
  }));
});

test('Basic Site Setup, URL Output Enabled With Name', () => {
  const stack = new Stack();
  const exportName = 'test-export-name';

  // WHEN
  new SPADeploy(stack, 'spaDeploy', {})
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      exportWebsiteUrlOutput: true,
      exportWebsiteUrlName: exportName,
    });

  // THEN
  expectCDK(stack).to(haveOutput({
    exportName,
  }));
});

test('Basic Site Setup, URL Output Enabled With No Name', () => {
  const stack = new Stack();
  const exportName = 'test-export-name';

  // WHEN
  new SPADeploy(stack, 'spaDeploy', {})
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      exportWebsiteUrlOutput: true,
    });

  // THEN
  expectCDK(stack).notTo(haveOutput({
    exportName,
  }));
});

test('Basic Site Setup, URL Output Not Enabled', () => {
  const stack = new Stack();
  const exportName = 'test-export-name';

  // WHEN
  new SPADeploy(stack, 'spaDeploy', {})
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      exportWebsiteUrlOutput: false,
    });

  // THEN
  expectCDK(stack).notTo(haveOutput({
    exportName,
  }));
});
