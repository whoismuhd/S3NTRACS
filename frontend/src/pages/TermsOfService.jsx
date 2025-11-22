import React from 'react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../components/Logo'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <LogoFull className="h-10" />
            </Link>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing and using S3ntraCS ("the Service"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300">
                S3ntraCS is a Cloud Security Posture Management (CSPM) platform that provides customizable security scanning, 
                compliance monitoring, and reporting for AWS cloud infrastructure. The Service allows you to select which scanners 
                to enable for each AWS account and performs read-only operations to identify security misconfigurations and compliance issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To use the Service, you must create an account by providing accurate and complete information. 
                You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are responsible for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Use strong, unique passwords</li>
                <li>Enable two-factor authentication when available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to violate any laws or regulations</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. AWS Account Access</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">5.1 Read-Only Access</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                S3ntraCS requires read-only access to your AWS accounts. We use AWS STS AssumeRole with temporary 
                credentials. We never store long-lived AWS access keys or secret keys.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">5.2 No Modifications</h3>
              <p className="text-gray-700 dark:text-gray-300">
                S3ntraCS performs read-only operations only. We do not modify, delete, or create any resources 
                in your AWS accounts. All scanning operations are non-invasive.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">5.3 Your Responsibility</h3>
              <p className="text-gray-700 dark:text-gray-300">
                You are responsible for ensuring that the IAM roles and permissions you provide to S3ntraCS are 
                correctly configured and follow AWS security best practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. Service Availability</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We strive to maintain high availability of the Service but do not guarantee uninterrupted access. 
                The Service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. 
                We are not liable for any damages resulting from Service unavailability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service, including its original content, features, and functionality, is owned by S3ntraCS 
                and is protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You retain ownership of your data. By using the Service, you grant us a license to use, store, 
                and process your data solely for the purpose of providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, S3NTRACS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
                DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied, including but not limited to implied warranties of merchantability, fitness for a particular 
                purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to indemnify and hold harmless S3ntraCS, its officers, directors, employees, and agents 
                from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of 
                your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">10. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                for any reason, including if you breach these Terms of Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You may terminate your account at any time by contacting us or using the account deletion feature 
                in the Settings page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify these Terms of Service at any time. We will notify users of any 
                material changes by posting the updated terms on this page and updating the "Last updated" date. 
                Your continued use of the Service after such changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms of Service shall be governed by and construed in accordance with applicable laws, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none space-y-2 text-gray-700 dark:text-gray-300">
                <li>Email: <a href="mailto:legal@s3ntracs.com" className="text-blue-600 dark:text-blue-400 hover:underline">legal@s3ntracs.com</a></li>
                <li>Support: <Link to="/support" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</Link></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}



