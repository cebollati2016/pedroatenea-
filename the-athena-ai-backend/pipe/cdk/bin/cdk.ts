#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BeanstalkPipelineStack } from '../lib/beanstalk-pipeline-stack';

const app = new cdk.App();
new BeanstalkPipelineStack(app, 'BeanstalkPipelineStack', {
  env: { region: 'us-east-1' }
});
