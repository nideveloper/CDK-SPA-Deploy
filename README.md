# CDK-SPA-Deploy
[![npm](https://img.shields.io/npm/dt/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/cdk-spa-deploy)](https://www.npmjs.com/package/cdk-spa-deploy)

This is an AWS CDK Construct to make deploying a single page website (Angular/React/Vue) to AWS S3 behind SSL/Cloudfront as easy as 5 lines of code.


## Installation and Usage

### Typescript
npm install --save cdk-spa-deploy

![cdk-spa-deploy example](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/spadeploy.png)

### Python
pip install cdk-spa-deploy

![cdk-spa-deploy python example](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/python.png)

## Advanced Usage

### Auto Deploy From Hosted Zone Name

If you purchased your domain through route 53 and already have a hosted zone then just use the name to deploy your site behind cloudfront. This handles the SSL cert and everything for you.

![cdk-spa-deploy alias](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/fromHostedZone.PNG)

### Custom Domain and SSL Certificates

You can also pass the ARN for an SSL certification and your alias routes to cloudfront

![cdk-spa-deploy alias](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/cdkdeploy-alias.png)

### Encrypted S3 Bucket

Pass in one boolean to tell SPA Deploy to encrypt your website bucket

![cdk-spa-deploy encryption](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/encryption.PNG)

### Restrict Access to Known IPs

Pass in a boolean and an array of IP addresses and your site is locked down!

![cdk-spa-deploy ipfilter](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/ipfilter.png)

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
