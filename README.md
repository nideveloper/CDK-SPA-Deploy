# CDK-SPA-Deploy

This is an AWS CDK Construct to make deploying a single page website (Angular/React/Vue) to AWS S3 behind SSL/Cloudfront easier


## Installation and Usage

### Typescript
npm install --save cdk-spa-deploy

![cdk-spa-deploy example](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/spadeploy.png)

### Python
pip install cdk-spa-deploy

![cdk-spa-deploy python example](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/python.png)

## Advanced Usage

### Custom Domain and SSL Certificates

You can also pass the ARN for an SSL certification and your alias routes to cloudfront

![cdk-spa-deploy alias](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/cdkdeploy-alias.png)

### Encrypted S3 Bucket

Pass in one boolean to tell SPA Deploy to encrypt your website bucket

![cdk-spa-deploy encryption](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/encryption.PNG)

### Restrict Access to Known IPs

Pass in a boolean and an array of IP addresses and your site is locked down!

![cdk-spa-deploy ipfilter](https://raw.githubusercontent.com/nideveloper/cdk-spa-deploy/master/img/ipfilter.png)

## Issues / Feature Requests

https://github.com/nideveloper/CDK-SPA-Deploy