import React from 'react';
import { Cat, Database, Shield, GitBranch, FileText, Smartphone, Globe, Server, Cpu, TrendingUp, CheckCircle, AlertTriangle, Clock, Users, ImageIcon } from 'lucide-react';

export const ResearchBreedchain: React.FC = () => (
    <div className="space-y-8 animate-fadeIn">
        {/* Header Section */}
        <div>
            <p className="text-slate-500 text-lg">
                A decentralized system for managing animal lineage, breeding records, and genetic information using <a
                    href="https://www.ibm.com/think/topics/hyperledger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 underline"
                >Hyperledger Fabric</a>.
            </p>
        </div>

        {/* Why Blockchain? - Sales Pitch Section */}
        <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-2xl p-8 border border-teal-100">
            <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-teal-500" />
                Why Blockchain for Breeding Management?
            </h4>
            <p className="text-slate-600 mb-6 leading-relaxed">
                Traditional breeding record systems—whether paper-based logbooks or centralized databases—are vulnerable to data loss, unauthorized modifications, and lack of transparency. Breedchain solves these critical challenges by leveraging blockchain technology, offering a fundamentally superior approach to managing animal lineage and breeding data.
            </p>

            {/* Comparison Table */}
            <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
                            <th className="text-center py-3 px-4 font-semibold text-slate-500">
                                <div className="flex items-center justify-center gap-2">
                                    <AlertTriangle size={16} className="text-red-400" />
                                    Paper-Based
                                </div>
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-slate-500">
                                <div className="flex items-center justify-center gap-2">
                                    <Database size={16} className="text-yellow-500" />
                                    Traditional DB
                                </div>
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-teal-600">
                                <div className="flex items-center justify-center gap-2">
                                    <Shield size={16} className="text-teal-500" />
                                    Breedchain
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Data Integrity</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ Easily altered or lost</td>
                            <td className="py-3 px-4 text-center text-yellow-600">⚠️ Admin can modify</td>
                            <td className="py-3 px-4 text-center text-teal-600 font-semibold">✅ Immutable & tamper-proof</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Audit Trail</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ No tracking</td>
                            <td className="py-3 px-4 text-center text-yellow-600">⚠️ Limited logs</td>
                            <td className="py-3 px-4 text-center text-teal-600 font-semibold">✅ Complete history preserved</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Regulatory Compliance</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ Manual documentation</td>
                            <td className="py-3 px-4 text-center text-yellow-600">⚠️ Export required</td>
                            <td className="py-3 px-4 text-center text-teal-600 font-semibold">✅ Auto-generated reports</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium">Multi-Organization Trust</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ Not possible</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ Central authority needed</td>
                            <td className="py-3 px-4 text-center text-teal-600 font-semibold">✅ Decentralized consensus</td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-medium">Data Recovery</td>
                            <td className="py-3 px-4 text-center text-red-500">❌ Disaster = permanent loss</td>
                            <td className="py-3 px-4 text-center text-yellow-600">⚠️ Depends on backups</td>
                            <td className="py-3 px-4 text-center text-teal-600 font-semibold">✅ Distributed redundancy</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Key Value Propositions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={18} className="text-teal-500" />
                        <span className="font-semibold text-slate-900">Data Integrity</span>
                    </div>
                    <p className="text-slate-600 text-sm">Every record is cryptographically signed and permanently stored. No modification or deletion possible.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <GitBranch size={18} className="text-teal-500" />
                        <span className="font-semibold text-slate-900">Complete Traceability</span>
                    </div>
                    <p className="text-slate-600 text-sm">Track every animal's complete lineage tree with verified parent-child relationships across generations.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-teal-500" />
                        <span className="font-semibold text-slate-900">Seamless Collaboration</span>
                    </div>
                    <p className="text-slate-600 text-sm">Hyperledger Fabric enables multiple organizations to join the same network, share verified breeding data, and scale the system effortlessly—no central authority required.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-teal-500" />
                        <span className="font-semibold text-slate-900">Instant Audit</span>
                    </div>
                    <p className="text-slate-600 text-sm">Generate IACUC and GLP-compliant audit logs instantly for regulatory submissions.</p>
                </div>
            </div>

            {/* Mobile App Coming Soon Notice */}
            <div className="mt-6 flex items-center gap-3 bg-teal-100 text-teal-800 px-4 py-3 rounded-xl">
                <Smartphone size={20} />
                <span className="font-medium">📱 Mobile Application now in development — Access and Maintain your breeding data anywhere, anytime with QR code scanning support.</span>
            </div>
        </div>

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Server size={20} className="text-teal-500" />
                    System Architecture
                </h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    Breedchain is built on <strong>Hyperledger Fabric 2.5</strong>, an enterprise-grade permissioned blockchain. The network consists of an <strong>Orderer node</strong> for transaction ordering and a <strong>Peer node</strong> with <strong>CouchDB 3.3</strong> as the state database, enabling rich queries on breeding records. The <strong>Backend API (Node.js)</strong> runs on <strong>Google Cloud Run</strong> (us-west1 region), connecting to the Fabric network via the Gateway SDK. The <strong>Web Frontend</strong> is hosted on <strong>Firebase Hosting</strong> at <a href="https://breedchain.distilledchild.space" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline font-medium">breedchain.distilledchild.space</a>, with CI/CD automated via Cloud Build.
                </p>

                {/* Architecture Diagram Placeholder - Replace with actual diagram */}
                <div className="bg-slate-100 rounded-2xl p-6 overflow-hidden shadow-inner border-2 border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[200px]">
                    <ImageIcon size={48} className="text-slate-400 mb-3" />
                    <p className="text-slate-500 font-medium text-center">System Architecture Diagram</p>
                    <p className="text-slate-400 text-sm text-center mt-1">Replace with architecture diagram image</p>
                    {/* Uncomment and update the src when you have the diagram
                    <img 
                        src="/images/breedchain-architecture.png" 
                        alt="Breedchain System Architecture Diagram" 
                        className="w-full h-auto rounded-lg"
                    />
                    */}
                </div>
            </div>

            <div className="space-y-6">
                <div className="border border-slate-100 p-6 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-2">
                        <Database size={18} className="text-teal-500" />
                        Key Features
                    </h4>
                    <ul className="list-disc list-inside text-slate-700 space-y-2">
                        <li><strong>Immutable Pedigree:</strong> Tamper-proof lineage records</li>
                        <li><strong>QR Code Integration:</strong> Quick animal identification</li>
                        <li><strong>Breeding History:</strong> Complete mating and offspring tracking</li>
                        <li><strong>Health Records:</strong> Vaccination and health event logging</li>
                    </ul>
                </div>
                <div className="border border-slate-100 p-6 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-2">
                        <Shield size={18} className="text-teal-500" />
                        Security & Privacy
                    </h4>
                    <ul className="list-disc list-inside text-slate-700 space-y-2">
                        <li><strong>Private Data Collections:</strong> Sensitive data isolation</li>
                        <li><strong>Role-Based Access:</strong> OAuth 2.0 authentication (Google accounts)</li>
                        <li><strong>Audit Trail:</strong> Complete transaction history</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Technology Stack */}
        <div>
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Cpu size={20} className="text-teal-500" />
                Technology Stack
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Server size={20} className="text-teal-600" />
                        </div>
                        <strong className="text-slate-900">Backend</strong>
                    </div>
                    <ul className="text-slate-600 text-sm space-y-1">
                        <li>• Hyperledger Fabric 2.5</li>
                        <li>• CouchDB 3.3 (State DB)</li>
                        <li>• Node.js Express API</li>
                        <li>• Google Cloud Run</li>
                        <li>• MongoDB Atlas (Off-chain)</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Globe size={20} className="text-teal-500" />
                        </div>
                        <strong className="text-slate-900">Web Frontend</strong>
                    </div>
                    <ul className="text-slate-600 text-sm space-y-1">
                        <li>• React + TypeScript</li>
                        <li>• Vite Build Tool</li>
                        <li>• Tailwind CSS</li>
                        <li>• Firebase Hosting</li>
                        <li>• Cloud Build CI/CD</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Smartphone size={20} className="text-teal-500" />
                        </div>
                        <strong className="text-slate-900">Mobile App</strong>
                    </div>
                    <ul className="text-slate-600 text-sm space-y-1">
                        <li>• Flutter / Dart</li>
                        <li>• Google OAuth 2.0</li>
                        <li>• QR Code Scanner</li>
                        <li>• Android / iOS</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Data Flow Diagram */}
        <div>
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GitBranch size={20} className="text-teal-500" />
                Data Flow
            </h4>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                            <Smartphone size={28} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Mobile/Web App</span>
                        <span className="text-xs text-slate-500">User Input</span>
                    </div>

                    <div className="hidden md:block text-slate-300 text-2xl">→</div>
                    <div className="md:hidden text-slate-300 text-2xl">↓</div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                            <Server size={28} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">REST API</span>
                        <span className="text-xs text-slate-500">Validation</span>
                    </div>

                    <div className="hidden md:block text-slate-300 text-2xl">→</div>
                    <div className="md:hidden text-slate-300 text-2xl">↓</div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                            <FileText size={28} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Chaincode</span>
                        <span className="text-xs text-slate-500">Smart Contract</span>
                    </div>

                    <div className="hidden md:block text-slate-300 text-2xl">→</div>
                    <div className="md:hidden text-slate-300 text-2xl">↓</div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                            <Database size={28} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Ledger</span>
                        <span className="text-xs text-slate-500">Immutable Record</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Use Cases */}
        <div>
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Cat size={20} className="text-teal-500" />
                Use Cases
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                    <h5 className="font-bold text-teal-900 mb-2">🧬 Genetic Research</h5>
                    <p className="text-teal-700 text-sm">
                        Support research by providing verified genetic lineage data for studying hereditary traits and improving breeding programs.
                    </p>
                </div>
                <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                    <h5 className="font-bold text-teal-900 mb-2">🐕 Canine Breeding</h5>
                    <p className="text-teal-700 text-sm">
                        Track purebred dog lineages, AKC registrations, health clearances, and breeding approvals with blockchain-verified documentation.
                    </p>
                </div>
                <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                    <h5 className="font-bold text-teal-900 mb-2">🐄 Livestock Management</h5>
                    <p className="text-teal-700 text-sm">
                        Manage cattle lineage for dairy and beef production, ensuring genetic diversity and traceability for food safety compliance.
                    </p>
                </div>
                <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                    <h5 className="font-bold text-teal-900 mb-2">🐎 Equine Registry</h5>
                    <p className="text-teal-700 text-sm">
                        Maintain thoroughbred and racing horse pedigrees with performance records, ownership transfers, and breeding rights verification.
                    </p>
                </div>
            </div>
        </div>


    </div>
);
