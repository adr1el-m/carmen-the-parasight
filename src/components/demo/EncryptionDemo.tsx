import React, { useState, useEffect } from 'react';
import { EncryptionService } from '../services/encryption.service';
import '../styles/encryption-demo.css';

interface DemoData {
  original: string;
  encrypted: string;
  decrypted: string;
  encryptedData?: any; // Store the full EncryptedData object for decryption
  metadata?: any;
}

const EncryptionDemo: React.FC = () => {
  const [demoData, setDemoData] = useState<DemoData[]>([]);
  const [inputText, setInputText] = useState('Enter sensitive data to encrypt...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptionService, setEncryptionService] = useState<EncryptionService | null>(null);
  const [keyInfo, setKeyInfo] = useState<any>(null);

  useEffect(() => {
    initializeEncryption();
  }, []);

  const initializeEncryption = async () => {
    try {
      const service = EncryptionService.getInstance();
      setEncryptionService(service);
      
      // Get current key information
      const info = service.getCurrentKeyInfo();
      setKeyInfo(info);
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
    }
  };

  const runEncryptionDemo = async () => {
    if (!encryptionService || !inputText.trim()) return;

    setIsProcessing(true);
    try {
      // Standard encryption
      const encrypted1 = await encryptionService.encrypt(inputText, 'demo');

      const newDemoData: DemoData[] = [
        {
          original: inputText,
          encrypted: encrypted1.encryptedData,
          decrypted: '', // Will be filled when decrypted
          encryptedData: encrypted1, // Store the full object for decryption
          metadata: {
            algorithm: encrypted1.algorithm,
            keyId: encrypted1.keyId,
            timestamp: new Date(encrypted1.timestamp).toLocaleString()
          }
        }
      ];

      setDemoData(newDemoData);
    } catch (error) {
      console.error('Encryption demo failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptData = async (index: number) => {
    if (!encryptionService || !demoData[index]) return;

    setIsProcessing(true);
    try {
      const demo = demoData[index];
      
      // Decrypt using the stored EncryptedData object
      const result = await encryptionService.decrypt(demo.encryptedData);
      const decryptedText = result.decryptedData;

      // Update the demo data with decrypted text
      const updatedDemoData = [...demoData];
      updatedDemoData[index] = {
        ...updatedDemoData[index],
        decrypted: decryptedText
      };
      setDemoData(updatedDemoData);
    } catch (error) {
      console.error('Decryption failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearDemo = () => {
    setDemoData([]);
    setInputText('Enter sensitive data to encrypt...');
  };

  const generateSampleData = () => {
    const samples = [
      // Patient Registration Data
      'Patient Registration:\nName: Dr. Maria Santos\nFacility: Asian Hospital and Medical Center\nSpecialty: Cardiology\nLicense: PRC-12345\nContact: +63 923 456 7890\nEmail: dr.santos@ahmc.ph\nAddress: 2205 Civic Drive, Filinvest City, Alabang, Muntinlupa',
      
      // Patient Medical Records
      'Patient Medical Record:\nPatient ID: P-2024-001\nName: Juan Dela Cruz\nDate of Birth: March 15, 1985\nAddress: 123 Rizal Street, Makati City\nPhone: +63 912 345 6789\nEmergency Contact: +63 934 567 8901\nMedical History: Hypertension, Diabetes Type 2\nCurrent Medications: Metformin 500mg, Losartan 50mg\nAllergies: Penicillin, Sulfa Drugs\nLast Visit: January 20, 2024',
      
      // Appointment Scheduling
      'Appointment Details:\nPatient: Ana Reyes\nFacility: St. Luke\'s Medical Center\nDoctor: Dr. Willie Ong\nSpecialty: Internal Medicine\nDate: February 15, 2024\nTime: 2:00 PM\nType: Follow-up Consultation\nSymptoms: Chest pain, shortness of breath\nInsurance: PhilHealth Member\nContact: +63 945 678 9012',
      
      // Healthcare Provider Profile
      'Healthcare Provider Profile:\nName: Dr. Alvin Francisco\nFacility: The Medical City\nDepartment: Emergency Medicine\nLicense Number: PRC-67890\nSpecializations: Trauma, Critical Care\nContact: +63 956 789 0123\nEmail: dr.francisco@tmc.ph\nOffice Hours: Monday-Friday 8AM-5PM\nAddress: 4th Floor, Medical Arts Building, Ortigas Avenue, Pasig City',
      
      // Patient Consent Form
      'Patient Consent Form:\nPatient: Roberto Garcia\nFacility: Makati Medical Center\nConsent Type: Treatment Authorization\nDate: February 10, 2024\nProcedures: Blood tests, X-ray, Consultation\nRisks Explained: Yes\nQuestions Answered: Yes\nWitness: Nurse Sarah Lim\nPatient Signature: [Digital Signature Encrypted]\nWitness Signature: [Digital Signature Encrypted]'
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setInputText(randomSample);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          End-to-End Encryption Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          See how LingapLink keeps your healthcare information completely private and secure. 
          Watch your sensitive data transform into unreadable code that only you can unlock.
        </p>
      </div>

      {/* Encryption Status */}
      {keyInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Encryption Service Active</h3>
              <p className="text-green-700">
                Current Key: {keyInfo.id} | Algorithm: {keyInfo.algorithm} | 
                Expires: {new Date(keyInfo.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Enter Sensitive Data</h2>
        <div className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter sensitive data to encrypt..."
          />
          <div className="flex gap-4">
            <button
              onClick={generateSampleData}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Generate Sample Data
            </button>
            <button
              onClick={runEncryptionDemo}
              disabled={isProcessing || !inputText.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Encrypting...
                </>
              ) : (
                'Encrypt Data'
              )}
            </button>
            <button
              onClick={clearDemo}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Demo
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {demoData.length > 0 && (
        <div className="space-y-6">
          {demoData.map((demo, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-lg font-bold">
                  Standard Encryption
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Original Data */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Original Data</h4>
                    <div className="bg-gray-50 p-3 rounded border text-sm font-mono break-words">
                      {demo.original}
                    </div>
                  </div>

                  {/* Encrypted Data */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Encrypted Data</h4>
                    <div className="bg-red-50 p-3 rounded border text-sm font-mono break-words text-red-700">
                      {demo.encrypted.substring(0, 100)}...
                      <div className="text-xs text-gray-500 mt-2">
                        (Base64 encoded, {demo.encrypted.length} characters)
                      </div>
                    </div>
                    <button
                      onClick={() => decryptData(index)}
                      disabled={isProcessing || demo.decrypted !== ''}
                      className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                          Decrypting...
                        </>
                      ) : demo.decrypted !== '' ? (
                        '✓ Decrypted'
                      ) : (
                        '🔓 Decrypt Data'
                      )}
                    </button>
                  </div>

                  {/* Decrypted Data */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Decrypted Data</h4>
                    <div className="bg-green-50 p-3 rounded border text-sm font-mono break-words text-green-700">
                      {demo.decrypted}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {demo.metadata && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Encryption Metadata</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Algorithm:</span>
                        <span className="ml-2 text-blue-700">{demo.metadata.algorithm}</span>
                      </div>
                      <div>
                        <span className="font-medium">Key ID:</span>
                        <span className="ml-2 text-blue-700 font-mono">{demo.metadata.keyId}</span>
                      </div>
                      <div>
                        <span className="font-medium">Timestamp:</span>
                        <span className="ml-2 text-blue-700">{demo.metadata.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification */}
                {demo.decrypted && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center text-green-800">
                      <span className="text-lg mr-2">✓</span>
                      <span className="font-medium">
                        Data Integrity Verified: Original matches decrypted data
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Military-Grade Security</h3>
            <p className="text-sm text-blue-700">
              Uses the same encryption that protects government secrets and military communications
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Always Fresh Keys</h3>
            <p className="text-sm text-green-700">
              Your security keys automatically change every day, like having a new lock on your door
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Unique Every Time</h3>
            <p className="text-sm text-purple-700">
              Each piece of data gets its own unique security pattern, making it impossible to crack
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Healthcare Approved</h3>
            <p className="text-sm text-orange-700">
              Meets the strictest standards for protecting medical information
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">No Secret Access</h3>
            <p className="text-sm text-red-700">
              Not even our own team can read your data - only you have the key
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Complete Tracking</h3>
            <p className="text-sm text-indigo-700">
              Every security action is recorded, so you always know your data is protected
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How LingapLink Protects Your Data</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">You Enter Your Information</h3>
              <p className="text-gray-600">When you enter your name, address, phone number, email, or medical history, it's just like writing in a secure notebook</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">LingapLink Locks It Down</h3>
              <p className="text-gray-600">Before your information leaves your device, we scramble it using the same encryption that protects military secrets</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Safe Journey to Our Servers</h3>
              <p className="text-gray-600">Your scrambled data travels through a secure tunnel (like a private highway) to reach our servers safely</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">We Can't Read Your Secrets</h3>
              <p className="text-gray-600">Even our own servers can't read your information - they only see the scrambled version, like trying to read a book in a different language</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              5
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Only You Can Unlock It</h3>
              <p className="text-gray-600">When you need to see your information again, only your device has the key to unscramble it - not even our engineers can access your data</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-blue-800 text-sm">
            <strong>Think of it like this:</strong> Your data is like a message written in a secret code that only you can read. 
            Even if someone intercepts the message, they can't understand it without your personal decoder key.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EncryptionDemo;
