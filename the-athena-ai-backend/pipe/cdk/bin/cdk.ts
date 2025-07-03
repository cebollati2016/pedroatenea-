#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BeanstalkPipelineStack } from '../lib/beanstalk-pipeline-stack';

const app = new cdk.App();
new BeanstalkPipelineStack(app, 'BeanstalkPipelineStack', {
  env: {
    account: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION
  }
});
