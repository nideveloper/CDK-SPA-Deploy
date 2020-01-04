#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkSpaDeployStack } from '../lib/cdk-spa-deploy-stack';

const app = new cdk.App();
new CdkSpaDeployStack(app, 'CdkSpaDeployStack');
