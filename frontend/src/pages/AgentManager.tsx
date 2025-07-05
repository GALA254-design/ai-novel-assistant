import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiSettings, FiUser, FiActivity, FiCode } from 'react-icons/fi';

interface Agent {
  id: number;
  name: string;
  type: string;
  status: string;
  config: string;
  createdAt: string;
  updatedAt: string;
}

const defaultAgent = {
  name: '',
  type: '',
  status: 'active',
  config: '',
};

const AgentManager: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<typeof defaultAgent>(defaultAgent);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch agents
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  // Open modal for add/edit
  const openModal = (agent?: Agent) => {
    if (agent) {
      setEditAgent(agent);
      setForm({
        name: agent.name,
        type: agent.type,
        status: agent.status,
        config: agent.config || '',
      });
    } else {
      setEditAgent(null);
      setForm(defaultAgent);
    }
    setModalOpen(true);
  };

  // Save agent (add or edit)
  const saveAgent = async () => {
    if (!form.name || !form.type) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const method = editAgent ? 'PUT' : 'POST';
      const url = editAgent ? `/api/agents/${editAgent.id}` : '/api/agents';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchAgents();
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
    setSaving(false);
  };

  // Delete agent
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/agents/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent mb-2">Agent Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your AI agents and their configurations</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => openModal()}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FiPlus className="w-4 h-4" />
            Add Agent
          </Button>
        </div>

        {/* Agents Table */}
        <Card className="p-0 overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 border-b border-blue-200 dark:border-blue-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-300">Config</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 dark:text-blue-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 dark:divide-blue-800">
                  {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
                          <FiSettings className="w-3 h-3" />
                          {agent.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          agent.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          <FiActivity className="w-3 h-3" />
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiCode className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                            {agent.config || 'No config'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            onClick={() => openModal(agent)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm"
                          >
                            <FiEdit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={() => setDeleteId(agent.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm"
                          >
                            <FiTrash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                          <FiSettings className="w-12 h-12 opacity-50" />
                          <p className="text-lg font-medium">No agents found</p>
                          <p className="text-sm">Create your first agent to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add/Edit Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAgent ? 'Edit Agent' : 'Add Agent'}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Agent Name *</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter agent name..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Agent Type *</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200" 
                value={form.type} 
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                placeholder="Enter agent type..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Status</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200" 
                value={form.status} 
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Configuration (JSON)</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200 font-mono text-sm resize-y" 
                rows={4} 
                value={form.config} 
                onChange={e => setForm(f => ({ ...f, config: e.target.value }))}
                placeholder='{"key": "value"}'
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={saveAgent}
                disabled={saving || !form.name || !form.type}
                className="flex items-center gap-2"
              >
                {saving ? <Loader size={16} /> : null}
                {editAgent ? 'Save Changes' : 'Add Agent'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Agent?">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-300">Confirm Deletion</p>
                <p className="text-sm text-red-600 dark:text-red-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} className="flex items-center gap-2">
                <FiTrash2 className="w-4 h-4" />
                Delete Agent
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AgentManager; 