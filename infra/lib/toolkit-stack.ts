import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import * as path from "path";

export interface ToolkitStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string;
  hostedZoneId: string;
  hostedZoneName: string;
}

export class ToolkitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ToolkitStackProps) {
    super(scope, id, props);

    const { domainName, certificateArn, hostedZoneId, hostedZoneName } = props;

    // S3 bucket for hosting the static website
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `${domainName.replace(/\./g, "-")}-website`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Import existing certificate from ACM (must be in us-east-1 for CloudFront)
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateArn
    );

    // CloudFront distribution with S3 origin using Origin Access Control (OAC)
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      domainNames: [domainName],
      certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Import existing hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: hostedZoneName,
      }
    );

    // Route53 A record pointing to CloudFront distribution
    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Deploy the built React app to S3
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../app/dist"))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // Outputs
    new cdk.CfnOutput(this, "WebsiteURL", {
      value: `https://${domainName}`,
      description: "Website URL",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront Distribution ID",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 Bucket Name",
    });
  }
}
