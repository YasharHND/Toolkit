#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ToolkitStack } from "../lib/toolkit-stack";

const app = new cdk.App();

// Environment variables
const region = process.env.AWS_REGION;
const account = process.env.AWS_ACCOUNT;
const domainName = process.env.DOMAIN_NAME;
const certificateArn = process.env.CERTIFICATE_ARN;
const hostedZoneId = process.env.HOSTED_ZONE_ID;
const hostedZoneName = process.env.HOSTED_ZONE_NAME;

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: region,
  AWS_ACCOUNT: account,
  DOMAIN_NAME: domainName,
  CERTIFICATE_ARN: certificateArn,
  HOSTED_ZONE_ID: hostedZoneId,
  HOSTED_ZONE_NAME: hostedZoneName,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}\n` +
      "Please ensure all required variables are set in your .env file."
  );
}

new ToolkitStack(app, "ToolkitStack", {
  env: {
    region,
    account,
  },
  domainName: domainName!,
  certificateArn: certificateArn!,
  hostedZoneId: hostedZoneId!,
  hostedZoneName: hostedZoneName!,
});
