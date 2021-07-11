import {
  expect as expectCDK, haveResource, haveResourceLike, haveOutput,
} from '@aws-cdk/assert';
import * as cf from '@aws-cdk/aws-cloudfront';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { BlockPublicAccess } from '@aws-cdk/aws-s3';
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
          Action: 's3:GetObject'
          ,
          Effect: 'Allow'
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
          Action: 's3:GetObject',
          Effect: 'Allow'
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


test('Cloudfront With Custom Role', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
    role: new Role(stack, 'myRole', {roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com')})
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Role: {
      "Fn::GetAtt": [
        "myRoleE60D68E8",
        "Arn"
      ]
    }
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

test('Basic Site Setup with Custom Role', () => {
  const stack = new Stack();

  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createBasicSite({
    indexDoc: 'index.html',
    errorDoc: 'error.html',
    websiteFolder: 'website',
    role: new Role(stack, 'myRole', {roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com')}),
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Role: {
      "Fn::GetAtt": [
        "myRoleE60D68E8",
        "Arn"
      ]
    }
  }));
});


test('Basic Site Setup with Undefined Role', () => {
  const stack = new Stack();

  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createBasicSite({
    indexDoc: 'index.html',
    errorDoc: 'error.html',
    websiteFolder: 'website',
    role: undefined
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Runtime: "python3.6",
    Role: {
      "Fn::GetAtt": [
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265",
        "Arn"
      ]
    }
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
        TargetOriginId: 'origin1',
      },
    },
  }));
});

test('Cloudfront With Custom Security Policy', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
    securityPolicy: cf.SecurityPolicyProtocol.TLS_V1_2_2019,
  });

  // THEN
  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.test.com',
      ],
      ViewerCertificate: {
        AcmCertificateArn: 'arn:1234',
        SslSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2019',
      },
    },
  }));
});

test('Cloudfront With Custom SSL Method', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
    sslMethod: cf.SSLMethod.VIP,
  });

  // THEN
  expectCDK(stack).to(haveResource('Custom::CDKBucketDeployment'));

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'www.test.com',
      ],
      ViewerCertificate: {
        AcmCertificateArn: 'arn:1234',
        SslSupportMethod: 'vip',
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
          Action: 's3:GetObject',
          Effect: 'Allow'
        }],
    },
  }));
});

test('Create From Hosted Zone with subdomain', () => {
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
      subdomain: 'myhost',
    });

  // THEN
  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [
        'myhost.cdkspadeploy.com',
      ],
      ViewerCertificate: {
        SslSupportMethod: 'sni-only',
      },
    },
  }));
});

test('Create From Hosted Zone with Custom Role', () => {
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
      role: new Role(stack, 'myRole', {roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com')})
    });

  // THEN
  
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    Role: {
      "Fn::GetAtt": [
        "myRoleE60D68E8",
        "Arn"
      ]
    }
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

test('Basic Site Setup, Block Public Enabled', () => {
  const stack = new Stack();

  // WHEN
  new SPADeploy(stack, 'spaDeploy', { ipFilter: true })
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

  // THEN
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
    },
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  }));
});
