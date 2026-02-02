'use client';

import { useState } from 'react';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import { 
  User,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function ContactPage() {
  const [contactType, setContactType] = useState('particulier');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '', 
    subject: '', 
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const submitData = {
        ...formData,
        contactType,
      };
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '', subject: '', companyName: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col mt-10">
      <HeaderHome />
      
      <main className="grow bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-center text-4xl font-bold text-gray-900 font-[agrandir]">
              Une question ? <span className="text-[#556822]">Contactez-nous</span>
            </h1>
            <p className="mb-8 text-center text-gray-600 font-[Maison_Neue]">
              Notre équipe est à votre écoute pour répondre à toutes vos questions sur nos produits et notre démarche.
            </p>
            
            {/* Toggle Buttons */}
            <div className="flex justify-center gap-4 mb-12">
              <button
                type="button"
                onClick={() => setContactType('particulier')}
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  contactType === 'particulier'
                    ? 'bg-[#556822] text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Particulier
              </button>
              <button
                type="button"
                onClick={() => setContactType('professionnel')}
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  contactType === 'professionnel'
                    ? 'bg-[#556822] text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Professionnel
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-2xl shadow-lg">
              {success && (
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-green-700">
                   Message envoyé avec succès ! Nous vous répondrons très bientôt.
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                   {error}
                </div>
              )}
              
              <div className={contactType === 'professionnel' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-[#469165]" strokeWidth={2} />
                    <label className="text-sm font-medium text-gray-700 font-[Maison_Neue]">Votre nom *</label>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all font-[Maison_Neue]"
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
                
                {contactType === 'professionnel' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-[#469165]" strokeWidth={2} />
                      <label className="text-sm font-medium text-gray-700 font-[Maison_Neue]">Société *</label>
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all font-[Maison_Neue]"
                      placeholder="Nom de votre entreprise"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-[#469165]" strokeWidth={2} />
                  <label className="text-sm font-medium text-gray-700">Objet de votre demande *</label>
                </div>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Ex: Renseignement produit, Partenariat, etc."
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-[#469165]" strokeWidth={2} />
                  <label className="text-sm font-medium text-gray-700">Adresse email *</label>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="votre.email@example.com"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-[#469165]" strokeWidth={2} />
                  <label className="text-sm font-medium text-gray-700">Message *</label>
                </div>
                <textarea
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Expliquez votre demande, votre commande ou votre projet..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#556822] py-3 font-bold text-white hover:bg-[#45591a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
