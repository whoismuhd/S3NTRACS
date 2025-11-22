import React, { useState } from 'react'

export default function RemediationAssistant({ finding, onMarkAsFixed }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [activeTab, setActiveTab] = useState('guide')
  
  const isMarkedAsFixed = finding.remediation_status === 'marked_fixed' || finding.remediation_status === 'verified_fixed'
  const isVerifiedFixed = finding.remediation_status === 'verified_fixed'

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Generate remediation suggestions based on finding type
  const getRemediationSteps = () => {
    const { category, title, resource_id, severity } = finding
    
    if (category === 'IAM') {
      if (title.includes('without MFA')) {
        const username = resource_id?.split('/')?.pop() || 'USERNAME'
        return {
          guide: `Enable Multi-Factor Authentication (MFA) for the IAM user to add an extra layer of security. MFA requires users to provide a second authentication factor in addition to their password.`,
          awsCli: [
            {
              label: '1. Create a virtual MFA device',
              command: `aws iam create-virtual-mfa-device --virtual-mfa-device-name ${username}-mfa --outfile QRCode.png --bootstrap-method QRCodePNG`
            },
            {
              label: '2. Enable MFA for the user',
              command: `aws iam enable-mfa-device --user-name ${username} --serial-number arn:aws:iam::ACCOUNT_ID:mfa/${username}-mfa --authentication-code-1 CODE1 --authentication-code-2 CODE2`
            },
            {
              label: '3. Verify MFA is enabled',
              command: `aws iam list-mfa-devices --user-name ${username}`
            }
          ],
          terraform: `# Add MFA policy requirement
resource "aws_iam_user" "${username.replace(/[^a-zA-Z0-9]/g, '_')}" {
  name = "${username}"
  
  # Force MFA for console access
  tags = {
    RequireMFA = "true"
  }
}

# Policy that requires MFA
data "aws_iam_policy_document" "${username.replace(/[^a-zA-Z0-9]/g, '_')}_mfa" {
  statement {
    effect = "Deny"
    actions = ["*"]
    resources = ["*"]
    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}`
        }
      } else if (title.includes('AdministratorAccess')) {
        const username = resource_id?.split('/')?.pop() || 'USERNAME'
        return {
          guide: `Remove the AdministratorAccess policy and apply the principle of least privilege. Grant only the specific permissions needed for the user's role.`,
          awsCli: [
            {
              label: '1. List current policies',
              command: `aws iam list-attached-user-policies --user-name ${username}`
            },
            {
              label: '2. Detach AdministratorAccess',
              command: `aws iam detach-user-policy --user-name ${username} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess`
            },
            {
              label: '3. Attach specific policy (example: ReadOnlyAccess)',
              command: `aws iam attach-user-policy --user-name ${username} --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess`
            }
          ],
          terraform: `# Remove AdministratorAccess and use specific policies
resource "aws_iam_user" "${username.replace(/[^a-zA-Z0-9]/g, '_')}" {
  name = "${username}"
}

# Attach specific read-only policy instead
resource "aws_iam_user_policy_attachment" "${username.replace(/[^a-zA-Z0-9]/g, '_')}_readonly" {
  user       = aws_iam_user.${username.replace(/[^a-zA-Z0-9]/g, '_')}.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}`
        }
      }
    } else if (category === 'S3') {
      const bucketName = resource_id || 'BUCKET_NAME'
      if (title.includes('Public')) {
        return {
          guide: `Remove public access from the S3 bucket. Public buckets can expose sensitive data. Use bucket policies and ACLs to restrict access to specific IAM users or roles.`,
          awsCli: [
            {
              label: '1. Block all public access',
              command: `aws s3api put-public-access-block --bucket ${bucketName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`
            },
            {
              label: '2. Remove public ACL grants',
              command: `aws s3api put-bucket-acl --bucket ${bucketName} --acl private`
            },
            {
              label: '3. Verify bucket is private',
              command: `aws s3api get-public-access-block --bucket ${bucketName}`
            }
          ],
          terraform: `# Make S3 bucket private
resource "aws_s3_bucket" "${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}" {
  bucket = "${bucketName}"
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}_pab" {
  bucket = aws_s3_bucket.${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Set bucket ACL to private
resource "aws_s3_bucket_acl" "${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}_acl" {
  bucket = aws_s3_bucket.${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}.id
  acl    = "private"
}`
        }
      } else if (title.includes('encryption')) {
        return {
          guide: `Enable default encryption for the S3 bucket. Encryption at rest protects your data even if the bucket is compromised. Use SSE-S3 (AWS managed keys) or SSE-KMS (customer managed keys) for better control.`,
          awsCli: [
            {
              label: '1. Enable default encryption (SSE-S3)',
              command: `aws s3api put-bucket-encryption --bucket ${bucketName} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`
            },
            {
              label: '2. Verify encryption is enabled',
              command: `aws s3api get-bucket-encryption --bucket ${bucketName}`
            }
          ],
          terraform: `# Enable default encryption
resource "aws_s3_bucket" "${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}" {
  bucket = "${bucketName}"
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}_encryption" {
  bucket = aws_s3_bucket.${bucketName.replace(/[^a-zA-Z0-9]/g, '_')}.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}`
        }
      }
    } else if (category === 'LOGGING') {
      if (title.includes('CloudTrail')) {
        return {
          guide: `Enable CloudTrail to log all API calls in your AWS account. CloudTrail provides an audit trail of actions taken in your account and is essential for security monitoring and compliance.`,
          awsCli: [
            {
              label: '1. Create CloudTrail trail',
              command: `aws cloudtrail create-trail --name security-audit-trail --s3-bucket-name YOUR-LOG-BUCKET`
            },
            {
              label: '2. Enable logging',
              command: `aws cloudtrail start-logging --name security-audit-trail`
            },
            {
              label: '3. Verify trail status',
              command: `aws cloudtrail get-trail-status --name security-audit-trail`
            }
          ],
          terraform: `# Enable CloudTrail
resource "aws_cloudtrail" "security_audit" {
  name           = "security-audit-trail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.id

  enable_logging                = true
  include_global_service_events  = true
  is_multi_region_trail         = true

  event_selector {
    read_write_type                 = "All"
    include_management_events        = true
    exclude_management_event_sources = []
  }
}

resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "your-cloudtrail-logs-bucket"
}`
        }
      } else if (title.includes('GuardDuty')) {
        return {
          guide: `Enable GuardDuty to continuously monitor your AWS account for malicious activity and unauthorized behavior. GuardDuty uses threat intelligence feeds and machine learning to detect threats.`,
          awsCli: [
            {
              label: '1. Enable GuardDuty',
              command: `aws guardduty create-detector --enable`
            },
            {
              label: '2. Verify GuardDuty is enabled',
              command: `aws guardduty list-detectors`
            }
          ],
          terraform: `# Enable GuardDuty
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}`
        }
      }
    }

    // Default fallback
    return {
      guide: finding.remediation || 'Review the finding and apply appropriate security controls.',
      awsCli: [],
      terraform: null
    }
  }

  const remediation = getRemediationSteps()

  return (
    <div className="mt-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 shadow-lg overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-bold text-white">AI-Powered Remediation Assistant</h3>
        </div>
        {onMarkAsFixed && !isVerifiedFixed && (
          <button
            onClick={() => onMarkAsFixed(finding.id)}
            disabled={isMarkedAsFixed}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
              isMarkedAsFixed
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isMarkedAsFixed ? 'Marked as Fixed' : 'Mark as Fixed'}
          </button>
        )}
        {isVerifiedFixed && (
          <div className="flex items-center gap-2 text-xs px-3 py-1 bg-green-500/20 text-green-100 rounded-lg font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified Fixed
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-blue-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'guide'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Guide
          </button>
          {remediation.awsCli.length > 0 && (
            <button
              onClick={() => setActiveTab('cli')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'cli'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              AWS CLI
            </button>
          )}
          {remediation.terraform && (
            <button
              onClick={() => setActiveTab('terraform')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'terraform'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Terraform
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'guide' && (
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {remediation.guide}
              </p>
              <div className="flex gap-2">
                {(() => {
                  let consoleUrl = 'https://console.aws.amazon.com/'
                  const resourceId = finding.resource_id || ''
                  
                  if (finding.category === 'IAM') {
                    const username = resourceId.split('/').pop() || ''
                    consoleUrl = `https://console.aws.amazon.com/iam/home#/users/${username}`
                  } else if (finding.category === 'S3') {
                    const bucketName = resourceId || ''
                    consoleUrl = `https://s3.console.aws.amazon.com/s3/buckets/${bucketName}?tab=properties`
                  } else if (finding.category === 'LOGGING') {
                    if (finding.title.includes('CloudTrail')) {
                      consoleUrl = 'https://console.aws.amazon.com/cloudtrail/home'
                    } else if (finding.title.includes('GuardDuty')) {
                      consoleUrl = 'https://console.aws.amazon.com/guardduty/home'
                    }
                  }
                  
                  return (
                    <a
                      href={consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in AWS Console
                    </a>
                  )
                })()}
              </div>
            </div>
          )}

          {activeTab === 'cli' && remediation.awsCli.length > 0 && (
            <div className="space-y-3">
              {remediation.awsCli.map((step, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-medium text-gray-300 mb-2">{step.label}</p>
                    <button
                      onClick={() => copyToClipboard(step.command, index)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy command"
                    >
                      {copiedIndex === index ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <code className="text-sm text-green-400 font-mono block whitespace-pre-wrap break-all">
                    {step.command}
                  </code>
                </div>
              ))}
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Replace placeholders (USERNAME, BUCKET_NAME, ACCOUNT_ID, etc.) with your actual values before running commands.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terraform' && remediation.terraform && (
            <div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 relative">
                <button
                  onClick={() => copyToClipboard(remediation.terraform, 'terraform')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy Terraform code"
                >
                  {copiedIndex === 'terraform' ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                  <code>{remediation.terraform}</code>
                </pre>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Replace placeholder values and apply with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">terraform apply</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

