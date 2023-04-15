# CDK-SPA-Deploy
[![npm](https://img.shields.io/npm/dt/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)

This is an AWS CDK Construct to make deploying a single page website (Angular/React/Vue) to AWS S3 behind SSL/Cloudfront as easy as 5 lines of code.


## Installation and Usage

### Typescript

```console
npm install --save cdk-spa-deploy
```

There is now a v1 and a v2 CDK version of this construct

#### For AWS CDK V1 Usage:

As of version 103.0 this construct now declares peer dependencies rather than bundling them so you can use it with any version of CDK higher than 103.0 without waiting on me to release a new version. The downside is that you will need to install the dependencies it uses for yourself, here is a list:
```json
{
    "constructs": "^3.3.75",
    "@aws-cdk/aws-certificatemanager": "^1.103.0",
    "@aws-cdk/aws-cloudfront": "^1.103.0",
    "@aws-cdk/aws-iam": "^1.103.0",
    "@aws-cdk/aws-route53": "^1.103.0",
    "@aws-cdk/aws-route53-patterns": "^1.103.0",
    "@aws-cdk/aws-route53-targets": "^1.103.0",
    "@aws-cdk/aws-s3": "^1.103.0",
    "@aws-cdk/aws-s3-deployment": "^1.103.0",
    "@aws-cdk/core": "^1.103.0"
}
```

#### For AWS CDK V2 usage:
Install v2.0.0-alpha.1 and use it like below based on your chosen language, no extra steps

```typescript
import * as cdk from '@aws-cdk/core';
import { SPADeploy } from 'cdk-spa-deploy';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SPADeploy(this, 'spaDeploy')
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: '../blog/dist/blog'
      });

    new SPADeploy(this, 'cfDeploy')
      .createSiteWithCloudfront({
        indexDoc: 'index.html',
        websiteFolder: '../blog/dist/blog'
      });
  }
}

```

### Python
```console
pip install cdk-spa-deploy
```

Note As of version 103.0 this construct now declares peer dependencies rather than bundling them so you can use it with any version of CDK higher than 103.0 without waiting on me to release a new version. The downside is that you will need to install the dependencies it uses for yourself. The npm versioms are listed above.

```python
from aws_cdk import core
from spa_deploy import SPADeploy

class PythonStack(core.Stack):
  def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)

    SPADeploy(self, 'spaDeploy').create_basic_site(
      index_doc='index.html',
      website_folder='../blog/blog/dist/blog'
    )


    SPADeploy(self, 'cfDeploy').create_site_with_cloudfront(
      index_doc='index.html',
      website_folder='../blog/blog/dist/blog'
    )
```

### Dotnet / C#

This project has now been published to nuget, more details to follow soon but you can find it [here](https://www.nuget.org/packages/CDKSPADeploy/1.80.0)

Note As of version 103.0 this construct now declares peer dependencies rather than bundling them so you can use it with any version of CDK higher than 103.0 without waiting on me to release a new version. The downside is that you will need to install the dependencies it uses for yourself. The npm versioms are listed above.

```bash
# package manager
Install-Package CDKSPADeploy -Version 1.80.0
# .NET CLI
dotnet add package CDKSPADeploy --version 1.80.0
# Package reference
<PackageReference Include="CDKSPADeploy" Version="1.80.0" />
# Paket CLI
paket add CDKSPADeploy --version 1.80.0
```

### Java

A version has now been published to maven.

Note As of version 103.0 this construct now declares peer dependencies rather than bundling them so you can use it with any version of CDK higher than 103.0 without waiting on me to release a new version. The downside is that you will need to install the dependencies it uses for yourself. The npm versioms are listed above.

```xml
<dependency>
  <groupId>com.cdkpatterns</groupId>
  <artifactId>CDKSPADeploy</artifactId>
  <version>1.81.0</version>
</dependency>
```

## Advanced Usage

### Auto Deploy From Hosted Zone Name

If you purchased your domain through route 53 and already have a hosted zone then just use the name to deploy your site behind cloudfront. This handles the SSL cert and everything for you.

```typescript
new SPADeploy(this, 'spaDeploy', { encryptBucket: true })
  .createSiteFromHostedZone({
    zoneName: 'cdkpatterns.com',
    indexDoc: 'index.html',
    websiteFolder: '../website/dist/website'
  });

```

### Custom Domain and SSL Certificates

You can also pass the ARN for an SSL certification and your alias routes to cloudfront

```typescript
import cdk = require('@aws-cdk/core');
import { SPADeploy } from 'cdk-spa-deploy';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SPADeploy(this, 'cfDeploy')
      .createSiteWithCloudfront({
        indexDoc: '../blog/dist/blog',
        certificateARN: 'arn:...',
        cfAliases: ['www.alias.com']
      });
  }  
}

```

### Encrypted S3 Bucket

Pass in one boolean to tell SPA Deploy to encrypt your website bucket

```typescript
new SPADeploy(this, 'cfDeploy', {encryptBucket: true}).createBasicSite({
    indexDoc: 'index.html',
    websiteFolder: 'website'
});

```

### Custom Origin Behaviors

Pass in an array of CloudFront Behaviors 

```typescript
new SPADeploy(this, 'cfDeploy').createSiteWithCloudfront({
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
```

### Restrict Access to Known IPs

Pass in a boolean and an array of IP addresses and your site is locked down!

```typescript
new SPADeploy(stack, 'spaDeploy', { 
  encryptBucket: true, 
  ipFilter: true, 
  ipList: ['1.1.1.1']
}).createBasicSite({
    indexDoc: 'index.html',
    websiteFolder: 'website'
  })
```

### Modifying S3 Bucket Created in Construct

An object is now returned containing relevant artifacts created if you need to make any further modifications:
  * The S3 bucket is present for all of the methods
  * When a CloudFront Web distribution is created it will be present in the return object

```typescript
export interface SPADeployment {
  readonly websiteBucket: s3.Bucket,
}

export interface SPADeploymentWithCloudFront extends SPADeployment {
  readonly distribution: CloudFrontWebDistribution,
}
```

### Setting the deployment lamba memory limit

The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket.

If you are deploying large files, you will need to increase this number accordingly. Defaults to 128mb

```typescript
import cdk = require('@aws-cdk/core');
import { SPADeploy } from 'cdk-spa-deploy';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SPADeploy(this, 'spaDeploy')
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: '../blog/dist/blog',
        memoryLimit: 1024
      });
  }
}
```

## Issues / Feature Requests

https://github.com/nideveloper/CDK-SPA-Deploy
