# CDK-SPA-Deploy
[![npm](https://img.shields.io/npm/dt/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)

This is an AWS CDK Construct to make deploying a single page website (Angular/React/Vue) to AWS S3 behind SSL/Cloudfront as easy as 5 lines of code.


## Installation and Usage

### Typescript

```console
npm install --save cdk-spa-deploy
```

```typescript
import cdk = require('@aws-cdk/core');
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

new SPADeploy(this, 'cfDeploy')
  .createBasicSite({
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

## Issues / Feature Requests

https://github.com/nideveloper/CDK-SPA-Deploy
