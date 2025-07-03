import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BeanstalkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = 'pedroatenea-node-app';

    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket');

    const ebApp = new elasticbeanstalk.CfnApplication(this, 'EBApp', {
      applicationName: appName,
    });

    const ebRole = new iam.Role(this, 'EBInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ]
    });

    const instanceProfile = new iam.CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [ebRole.roleName]
    });

    const environment = new elasticbeanstalk.CfnEnvironment(this, 'EBEnv', {
      environmentName: `${appName}-env`,
      applicationName: ebApp.applicationName!,
      solutionStackName: '64bit Amazon Linux 2 v5.8.4 running Node.js 18',
      optionSettings: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.ref
        },
        {
          namespace: 'aws:elasticbeanstalk:container:nodejs',
          optionName: 'NodeCommand',
          value: 'npm start'
        }
      ]
    });

    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      }
    });

    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "elasticbeanstalk:*",
        "s3:*",
        "iam:PassRole"
      ],
      resources: ["*"]
    }));

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'cebollati2016',
              repo: 'pedroatenea',
              branch: 'main',
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              output: sourceOutput,
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildApp',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            })
          ]
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.ElasticBeanstalkDeployAction({
              actionName: 'DeployToEB',
              applicationName: ebApp.applicationName!,
              environmentName: environment.environmentName!,
              input: buildOutput,
            })
          ]
        }
      ]
    });
  }
}
