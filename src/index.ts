import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const token = process.env.GITHUB_TOKEN || getInput("repoToken");

const createCheck = async () => {
  const octoKit = getOctokit(token, context);

  const check = await octoKit.rest.checks.create({
    ...context.repo,
    name: "Deploy Preview",
    head_sha: context.payload.pull_request?.head.sha,
    status: "in_progress",
  });

  return async (details: any) => {
    await octoKit.rest.checks.create({
      ...context.repo,
      check_run_id: check.data.id,
      completed_at: new Date().toISOString(),
      status: "completed",
      ...details,
    });
  };
};

async function main() {
  const isPullRequest = !!context.payload.pull_request;

  const APP_ID = getInput("app_id");
  const AWS_ID = getInput("aws_access_id");
  const AWS_KEY = getInput("aws_access_key");
  const S3_PATH = getInput("s3_bucket_path");

  let finish = (details: Object) => console.log(details);

  if (isPullRequest) {
    finish = await createCheck();
  }

  const s3Client = new S3Client({
    credentials: {
      accessKeyId: AWS_ID,
      secretAccessKey: AWS_KEY,
    },
    region: "eu-central-1",
  });
  const zipFile = readFileSync("./build.zip");
  const uniqueFileName = context.ref.slice(0, 10);

  const c = new PutObjectCommand({
    Bucket: S3_PATH,
    Key: `build-${uniqueFileName}.zip`,
    Body: zipFile,
  });

  s3Client.send(c);

  await finish({
    conclusion: "success",
    output: {
      title: `Deploy preview succeeded`,
      summary: "Success",
    },
  });
}
