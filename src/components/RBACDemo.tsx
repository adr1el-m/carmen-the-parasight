import React, { useState, useEffect } from 'react';
import '../styles/rbac-demo.css';

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  accessLevel: 'read' | 'write' | 'admin';
  color: string;
}

interface DemoScenario {
  userType: string;
  role: UserRole;
  actions: string[];
  restrictedActions: string[];
  explanation: string;
}

const RBACDemo: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('patient');
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessResult, setAccessResult] = useState<string>('');

  // Define user roles and their permissions
  const userRoles: UserRole[] = [
    {
      id: 'patient',
      name: 'Patient',
      description: 'Regular patient users with limited access to their own data',
      permissions: ['View own medical records', 'Book appointments', 'Update personal info', 'View own prescriptions'],
      accessLevel: 'read',
      color: '#3b82f6'
    },
         {
       id: 'healthcare-provider',
       name: 'Healthcare Provider',
       description: 'Medical professionals including doctors, nurses, and clinical staff with access to patient data and medical tools',
       permissions: ['View patient records', 'Update medical history', 'Prescribe medications', 'Schedule appointments', 'Book appointments', 'View lab results', 'Update patient status', 'Schedule follow-ups'],
       accessLevel: 'write',
       color: '#10b981'
     }
  ];

  // Define demo scenarios for each role
  const demoScenarios: DemoScenario[] = [
    {
      userType: 'Patient Juan Dela Cruz',
      role: userRoles[0],
      actions: ['View own medical records', 'Book appointment with Dr. Santos', 'Update personal information'],
      restrictedActions: ['View other patients\' data', 'Access medical tools', 'Modify medical records', 'Prescribe medications'],
      explanation: 'Patients can only access their own information and basic platform features. They cannot see other patients\' data or use medical professional tools.'
    },
         {
       userType: 'Healthcare Provider (Dr. Maria Santos)',
       role: userRoles[1],
       actions: ['View patient Juan\'s records', 'Update medical history', 'Prescribe Metformin', 'Schedule appointments', 'Book appointments', 'Update patient status'],
       restrictedActions: ['Access admin panel', 'View system logs', 'Modify user roles', 'Manage platform settings'],
       explanation: 'Healthcare providers including doctors, nurses, and clinical staff have access to patient data and medical tools, but cannot access system administration features or modify user permissions.'
     }
  ];

  const currentScenario = demoScenarios.find(s => s.role.id === selectedRole) || demoScenarios[0];

  const simulateAccessCheck = async (action: string) => {
    setIsProcessing(true);
    setAccessResult('');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const role = userRoles.find(r => r.id === selectedRole);
    if (!role) return;

    // Check if action is allowed for the selected role
    const isAllowed = role.permissions.some(permission => 
      permission.toLowerCase().includes(action.toLowerCase()) ||
      action.toLowerCase().includes(permission.toLowerCase())
    );

    if (isAllowed) {
      setAccessResult(`✅ ACCESS GRANTED: ${role.name} can perform "${action}"`);
    } else {
      setAccessResult(`❌ ACCESS DENIED: ${role.name} cannot perform "${action}"`);
    }

    setIsProcessing(false);
  };

  const testCommonActions = () => {
    const actions = [
      'View patient records',
      'Book appointment',
      'Update medical history',
      'Access admin panel',
      'View system logs'
    ];

    actions.forEach((action, index) => {
      setTimeout(() => simulateAccessCheck(action), index * 800);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Role-Based Access Control Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience how LingapLink ensures data security through intelligent role-based permissions. 
          See how different user types access only the information and tools they need.
        </p>
      </div>

      {/* Role Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select User Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRoles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedRole === role.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-800">{role.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{role.accessLevel}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Role Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Current User: {currentScenario.userType}
            </h2>
            <p className="text-gray-600 mb-4">{currentScenario.role.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-700 mb-2">✅ Allowed Actions</h3>
                <ul className="space-y-2">
                  {currentScenario.actions.map((action, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-red-700 mb-2">❌ Restricted Actions</h3>
                <ul className="space-y-2">
                  {currentScenario.restrictedActions.map((action, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-blue-800 text-sm">
                <strong>How it works:</strong> {currentScenario.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control Testing */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Test Access Control</h2>
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={testCommonActions}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Test Common Actions
            </button>
            <button
              onClick={() => setAccessResult('')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Test Specific Actions</h3>
              <div className="space-y-2">
                {['View patient records', 'Book appointment', 'Update medical history', 'Access admin panel'].map((action) => (
                  <button
                    key={action}
                    onClick={() => simulateAccessCheck(action)}
                    disabled={isProcessing}
                    className="w-full text-left px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Access Results</h3>
              <div className="min-h-[120px] p-3 bg-gray-50 rounded border">
                {isProcessing ? (
                  <div className="flex items-center text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Checking permissions...
                  </div>
                ) : accessResult ? (
                  <p className={`text-sm ${
                    accessResult.includes('GRANTED') ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {accessResult}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">Click "Test Common Actions" or test specific actions to see results</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">RBAC Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Principle of Least Privilege</h3>
            <p className="text-sm text-blue-700">
              Users only get access to the minimum data and tools they need to perform their job
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Role-Based Permissions</h3>
            <p className="text-sm text-green-700">
              Access is controlled by predefined roles rather than individual user settings
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Access Auditing</h3>
            <p className="text-sm text-purple-700">
              All access attempts and data interactions are logged for security compliance
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Dynamic Access Control</h3>
            <p className="text-sm text-orange-700">
              Permissions can be updated in real-time without affecting other users
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">HIPAA Compliance</h3>
            <p className="text-sm text-red-700">
              Meets healthcare data access requirements and audit standards
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Multi-Factor Security</h3>
            <p className="text-sm text-indigo-700">
              Combines role-based access with authentication and encryption layers
            </p>
          </div>
        </div>
      </div>

      {/* How RBAC Works */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How Role-Based Access Control Works</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">User Authentication</h3>
              <p className="text-gray-600">User logs in and their identity is verified through secure authentication</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Role Assignment</h3>
              <p className="text-gray-600">System assigns the user to their predefined role (Patient, Doctor, Nurse, Admin)</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Permission Check</h3>
              <p className="text-gray-600">When user tries to access data or perform actions, system checks their role permissions</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Access Decision</h3>
              <p className="text-gray-600">System grants or denies access based on role permissions and data ownership</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              5
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Audit Logging</h3>
              <p className="text-gray-600">All access attempts and data interactions are logged for security and compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACDemo;
