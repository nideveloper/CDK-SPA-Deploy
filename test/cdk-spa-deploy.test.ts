import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Stack, App } from 'aws-cdk-lib/';
import { SPADeploy } from '../lib';

test('Cloudfront Distribution Included', () => {
  const stack = new Stack();
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy');

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
  });

  const template = Template.fromStack(stack);
  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution',
    Match.objectLike({
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

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
          })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html',
      },
    }));

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution',
    Match.objectLike({
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

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
          })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution',
    Match.objectLike({
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
    role: new Role(stack, 'myRole', { roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com') }),
  });

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::Lambda::Function',
    Match.objectLike({
      Role: {
        'Fn::GetAtt': [
          'myRoleE60D68E8',
          'Arn',
        ],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
          })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html',
      },
    }));

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
          })],
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
    role: new Role(stack, 'myRole', { roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com') }),
  });

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::Lambda::Function',
    Match.objectLike({
      Role: {
        'Fn::GetAtt': [
          'myRoleE60D68E8',
          'Arn',
        ],
      },
    }));

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
          }),
          Match.objectLike({
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
              's3:DeleteObject*',
              's3:PutObject*',
              's3:Abort*',
            ],
            Condition: {
              StringEquals: {
                'aws:PrincipalArn': {
                  'Fn::GetAtt': [
                    'myRoleE60D68E8',
                    'Arn',
                  ],
                },
              },
            },
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
          })],
      },
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
    role: undefined,
  });

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::Lambda::Function',
    Match.objectLike({
      Runtime: 'python3.7',
      Role: {
        'Fn::GetAtt': [
          'CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756CServiceRole89A01265',
          'Arn',
        ],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
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

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
          })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
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

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
    DistributionConfig: {
      CacheBehaviors: [
        Match.objectLike({
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
          PathPattern: '/virtual-path',
        }),
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
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

type RestrictionType = 'whitelist' | 'blacklist';
test.each(['whitelist' as RestrictionType, 'blacklist' as RestrictionType])('Cloudfront With GeoRestriction for GB', (restrictionType: RestrictionType) => {
  const stack = new Stack();
  const gbLocation = 'GB';
  // WHEN
  const deploy = new SPADeploy(stack, 'spaDeploy', { });

  deploy.createSiteWithCloudfront({
    indexDoc: 'index.html',
    websiteFolder: 'website',
    certificateARN: 'arn:1234',
    cfAliases: ['www.test.com'],
    geoRestriction: {
      restrictionType,
      locations: [gbLocation],
    },
  });

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
    DistributionConfig: {
      Restrictions: {
        GeoRestriction: {
          Locations: [gbLocation],
          RestrictionType: restrictionType,
        },
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
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

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::S3::BucketPolicy', Match.objectLike({
    PolicyDocument: {
      Statement: [
        Match.objectLike({
          Action: 's3:GetObject',
          Condition: {
            IpAddress: {
              'aws:SourceIp': [
                '1.1.1.1',
              ],
            },
          },
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
        })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket',
    Match.objectLike({
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

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
    DistributionConfig: {
      Aliases: [
        'www.cdkspadeploy.com',
      ],
      ViewerCertificate: {
        SslSupportMethod: 'sni-only',
      },
    },
  }));

  template.hasResourceProperties('AWS::S3::BucketPolicy',
    Match.objectLike({
      PolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
          })],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
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
      role: new Role(stack, 'myRole', { roleName: 'testRole', assumedBy: new ServicePrincipal('lambda.amazonaws.com') }),
    });

  const template = Template.fromStack(stack);

  // THEN

  template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
    Role: {
      'Fn::GetAtt': [
        'myRoleE60D68E8',
        'Arn',
      ],
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
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

  template.hasResource('Custom::CDKBucketDeployment', {});

  template.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
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

test('Basic Site Setup, Block Public Enabled', () => {
  const stack = new Stack();

  // WHEN
  new SPADeploy(stack, 'spaDeploy')
    .createBasicSite({
      indexDoc: 'index.html',
      websiteFolder: 'website',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

  const template = Template.fromStack(stack);

  // THEN
  template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
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

  const template = Template.fromStack(stack);

  // THEN
  template.hasOutput(exportName, {
    Export: {
      Name: exportName,
    },
  });
});

test('Basic Site Setup, URL Output Enabled With No Name', () => {
  const stack = new Stack();

  // WHEN
  expect(() => {
    new SPADeploy(stack, 'spaDeploy', {})
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: 'website',
        exportWebsiteUrlOutput: true,
      });
  }).toThrowError();
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

  const template = Template.fromStack(stack);

  // THEN
  expect(() => {
    template.hasOutput(exportName, {
      Export: {
        Name: exportName,
      },
    });
  }).toThrowError();
});
