import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../../shared/navigation/BottomNavbar';
import { defaultFaqs } from '../../shared/constants/faqs';
import { supabase } from '../../lib/supabase';

const API_BASE = 'http://localhost:5000/api/v1/admin';

const fallbackServices = [
  { id: 'wash', name: 'Wash', currentPrice: 60.0, previousPrice: null },
  { id: 'dry', name: 'Dry', currentPrice: 65.0, previousPrice: null },
  { id: 'fold', name: 'Fold', currentPrice: 30.0, previousPrice: null },
];

const fallbackAddOns = [
  { id: 'detergent', name: 'Detergent', currentPrice: 24.0, previousPrice: null },
  { id: 'fabric-conditioner', name: 'Fabric Conditioner', currentPrice: 20.0, previousPrice: null },
];

const fallbackSchedule = {
  opens: '10:00',
  closes: '22:00',
};

// Helper: get auth headers for API requests
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export default function ManageServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState(fallbackServices);
  const [addOns, setAddOns] = useState(fallbackAddOns);
  const [schedule, setSchedule] = useState(fallbackSchedule);
  const [previousSchedule, setPreviousSchedule] = useState(null);
  const [history, setHistory] = useState([]);
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Fetch services, add-ons, schedule from backend
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      const authHeaders = await getAuthHeaders();

      // Fetch services + add-ons + schedule
      const servicesRes = await fetch(`${API_BASE}/services`, { headers: authHeaders });
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        if (data.services && data.services.length > 0) setServices(data.services);
        if (data.addOns && data.addOns.length > 0) setAddOns(data.addOns);
        if (data.schedule) {
          setSchedule({ opens: data.schedule.opens, closes: data.schedule.closes });
          if (data.schedule.previousOpens || data.schedule.previousCloses) {
            setPreviousSchedule({
              opens: data.schedule.previousOpens || data.schedule.opens,
              closes: data.schedule.previousCloses || data.schedule.closes,
            });
          }
        }
      } else {
        setFetchError('Could not load services from server. Showing local data.');
      }

      // Fetch FAQs
      const faqsRes = await fetch(`${API_BASE}/services/faqs`, { headers: authHeaders });
      if (faqsRes.ok) {
        const faqData = await faqsRes.json();
        if (faqData.length > 0) setFaqs(faqData);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setFetchError('Could not connect to server. Showing local data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '' });
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [selectedTermsFile, setSelectedTermsFile] = useState(null);
  const [termsDocument, setTermsDocument] = useState(null);
  const [serviceDraft, setServiceDraft] = useState({ name: '', currentPrice: '' });
  const [addOnDraft, setAddOnDraft] = useState({ name: '', currentPrice: '' });

  // UI State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleEditClick = (type, item = null) => {
    setEditType(type);
    setEditItem(type === 'service' || type === 'addon' ? { ...item } : { ...schedule });
    setIsEditModalOpen(true);
  };

  const handleConfirmSave = () => {
    setIsEditModalOpen(false);
    setShowConfirmModal(true);
  };

  const handleFinalSave = async () => {
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (editType === 'service' || editType === 'addon') {
      const updatedPrice = Number(editItem.currentPrice);
      if (Number.isNaN(updatedPrice)) {
        setShowConfirmModal(false);
        return;
      }

      const setCollection = editType === 'service' ? setServices : setAddOns;
      const label = editType === 'service' ? 'Service' : 'Add-On';
      let oldPrice = null;

      setCollection((prev) =>
        prev.map((s) => {
          if (s.id === editItem.id) {
            oldPrice = s.currentPrice;
            if (s.currentPrice !== updatedPrice) {
              const newLog = {
                id: Date.now(),
                timestamp: `${formattedDate} at ${formattedTime}`,
                message: `Updated ${s.name} ${label} Price`,
                details: `Changed from ₱${s.currentPrice.toFixed(2)} to ₱${updatedPrice.toFixed(2)}`,
              };
              setHistory((prev) => [newLog, ...prev]);
            }
            return { ...editItem, currentPrice: updatedPrice, previousPrice: s.currentPrice };
          }
          return s;
        })
      );

      // Persist to backend
      try {
        const authHeaders = await getAuthHeaders();
        await fetch(`${API_BASE}/services/items/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ currentPrice: updatedPrice, previousPrice: oldPrice }),
        });
      } catch (error) {
        console.error('Failed to persist price update:', error);
      }
    } else {
      if (schedule.opens !== editItem.opens || schedule.closes !== editItem.closes) {
        const newLog = {
          id: Date.now(),
          timestamp: `${formattedDate} at ${formattedTime}`,
          message: 'Updated Schedule',
          details: `Opens: ${schedule.opens} → ${editItem.opens}, Closes: ${schedule.closes} → ${editItem.closes}`,
        };
        setHistory((prev) => [newLog, ...prev]);
        setPreviousSchedule({ ...schedule });
      }
      const prevSchedule = { ...schedule };
      setSchedule({ ...editItem });

      // Persist schedule to backend
      try {
        const authHeaders = await getAuthHeaders();
        await fetch(`${API_BASE}/services/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            opens: editItem.opens,
            closes: editItem.closes,
            previousOpens: prevSchedule.opens,
            previousCloses: prevSchedule.closes,
          }),
        });
      } catch (error) {
        console.error('Failed to persist schedule update:', error);
      }
    }
    setShowConfirmModal(false);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const handleRevert = async (type, item = null) => {
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (type === 'service' || type === 'addon') {
      if (item.previousPrice === null) return;

      const setCollection = type === 'service' ? setServices : setAddOns;
      const label = type === 'service' ? 'Service' : 'Add-On';

      const newLog = {
        id: Date.now(),
        timestamp: `${formattedDate} at ${formattedTime}`,
        message: `Reverted ${item.name} ${label} Price`,
        details: `Restored price to ₱${item.previousPrice.toFixed(
          2
        )} (was ₱${item.currentPrice.toFixed(2)})`,
      };
      setHistory((prev) => [newLog, ...prev]);

      setCollection((prev) =>
        prev.map((s) => {
          if (s.id === item.id) {
            return {
              ...s,
              currentPrice: s.previousPrice,
              previousPrice: s.currentPrice,
            };
          }
          return s;
        })
      );

      // Persist revert to backend
      try {
        const authHeaders = await getAuthHeaders();
        await fetch(`${API_BASE}/services/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ currentPrice: item.previousPrice, previousPrice: item.currentPrice }),
        });
      } catch (error) {
        console.error('Failed to persist revert:', error);
      }
    } else if (type === 'schedule') {
      if (!previousSchedule) return;

      const newLog = {
        id: Date.now(),
        timestamp: `${formattedDate} at ${formattedTime}`,
        message: 'Reverted Schedule',
        details: `Restored to ${previousSchedule.opens} - ${previousSchedule.closes} (was ${schedule.opens} - ${schedule.closes})`,
      };
      setHistory((prev) => [newLog, ...prev]);

      const oldSchedule = { ...schedule };
      setSchedule({ ...previousSchedule });
      setPreviousSchedule({ ...schedule });

      // Persist schedule revert to backend
      try {
        const authHeaders = await getAuthHeaders();
        await fetch(`${API_BASE}/services/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            opens: previousSchedule.opens,
            closes: previousSchedule.closes,
            previousOpens: oldSchedule.opens,
            previousCloses: oldSchedule.closes,
          }),
        });
      } catch (error) {
        console.error('Failed to persist schedule revert:', error);
      }
    }
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1500);
  };

  const handleItemDraftChange = (type, field, value) => {
    if (type === 'service') {
      setServiceDraft((prev) => ({ ...prev, [field]: value }));
      return;
    }

    setAddOnDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async (type) => {
    const draft = type === 'service' ? serviceDraft : addOnDraft;
    const setCollection = type === 'service' ? setServices : setAddOns;
    const setDraft = type === 'service' ? setServiceDraft : setAddOnDraft;
    const label = type === 'service' ? 'Service' : 'Add-On';
    const name = draft.name.trim();
    const price = Number(draft.currentPrice);

    if (!name || Number.isNaN(price) || price < 0) return;

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Persist to backend first to get real ID
    let newId = `${type}-${Date.now()}`;
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/services/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ type, name, currentPrice: price }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.id) newId = data.id;
      }
    } catch (error) {
      console.error('Failed to persist new item:', error);
    }

    setCollection((prev) => [
      ...prev,
      {
        id: newId,
        name,
        currentPrice: price,
        previousPrice: null,
      },
    ]);

    setHistory((prev) => [
      {
        id: Date.now(),
        timestamp: `${formattedDate} at ${formattedTime}`,
        message: `Added ${name} ${label}`,
        details: `Initial price set to ₱${price.toFixed(2)}`,
      },
      ...prev,
    ]);

    setDraft({ name: '', currentPrice: '' });
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1500);
  };

  const handleDeleteItem = (type, item) => {
    setPendingDelete({ type, item });
    setShowDeleteConfirmModal(true);
  };

  const handleFinalDelete = async () => {
    if (!pendingDelete) return;

    const { type, item } = pendingDelete;
    const setCollection = type === 'service' ? setServices : setAddOns;
    const label = type === 'service' ? 'Service' : 'Add-On';
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    setCollection((prev) => prev.filter((entry) => entry.id !== item.id));

    setHistory((prev) => [
      {
        id: Date.now(),
        timestamp: `${formattedDate} at ${formattedTime}`,
        message: `Deleted ${item.name} ${label}`,
        details: `Removed item priced at ₱${item.currentPrice.toFixed(2)}`,
      },
      ...prev,
    ]);

    // Persist deletion to backend
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`${API_BASE}/services/items/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch (error) {
      console.error('Failed to persist deletion:', error);
    }

    setShowDeleteConfirmModal(false);
    setPendingDelete(null);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1500);
  };

  const handleFaqInputChange = (field, value) => {
    setFaqDraft((prev) => ({ ...prev, [field]: value }));
  };

  const resetFaqForm = () => {
    setFaqDraft({ question: '', answer: '' });
    setEditingFaqId(null);
  };

  const handleSaveFaq = async () => {
    const question = faqDraft.question.trim();
    const answer = faqDraft.answer.trim();

    if (!question || !answer) return;

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/services/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          id: editingFaqId || undefined,
          question,
          answer,
        }),
      });

      if (editingFaqId) {
        setFaqs((prev) =>
          prev.map((faq) =>
            faq.id === editingFaqId
              ? {
                  ...faq,
                  question,
                  answer,
                }
              : faq
          )
        );
      } else {
        let newId = `faq-${Date.now()}`;
        if (response.ok) {
          const data = await response.json();
          if (data.id) newId = data.id;
        }
        setFaqs((prev) => [
          ...prev,
          {
            id: newId,
            question,
            answer,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to persist FAQ:', error);
      // Still update local state as fallback
      if (editingFaqId) {
        setFaqs((prev) =>
          prev.map((faq) =>
            faq.id === editingFaqId ? { ...faq, question, answer } : faq
          )
        );
      } else {
        setFaqs((prev) => [...prev, { id: `faq-${Date.now()}`, question, answer }]);
      }
    }

    resetFaqForm();
  };

  const handleEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqDraft({ question: faq.question, answer: faq.answer });
  };

  const handleDeleteFaq = async (faqId) => {
    setFaqs((prev) => prev.filter((faq) => faq.id !== faqId));
    if (editingFaqId === faqId) {
      resetFaqForm();
    }

    // Persist FAQ deletion to backend
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`${API_BASE}/services/faqs/${faqId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch (error) {
      console.error('Failed to persist FAQ deletion:', error);
    }
  };

  const handleMoveFaq = (index, direction) => {
    setFaqs((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const reordered = [...prev];
      const [movedItem] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, movedItem);

      // Persist reorder to backend
      const orderedIds = reordered.map((faq) => faq.id);
      getAuthHeaders().then((authHeaders) => {
        fetch(`${API_BASE}/services/faqs/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ orderedIds }),
        }).catch((err) => console.error('Failed to persist FAQ reorder:', err));
      });

      return reordered;
    });
  };

  const handleTermsFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setSelectedTermsFile(selected);
  };

  const handleUploadTerms = () => {
    if (!selectedTermsFile) return;

    setTermsDocument({
      name: selectedTermsFile.name,
      size: selectedTermsFile.size,
      uploadedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    });

    setSelectedTermsFile(null);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <main className="mx-auto w-full max-w-2xl pb-24 md:max-w-5xl lg:max-w-6xl">
        {loading && <p className="text-gray-500 mb-4">Loading services...</p>}
        {fetchError && <p className="text-amber-600 text-sm mb-4">{fetchError}</p>}
        <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Manage Services</h1>
        </header>

        {/* Services & Schedule */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Services Section */}
          <section className="rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#3878c2]">Services</h2>
            <div className="w-full">
              <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1.6fr_1fr_auto]">
                <input
                  type="text"
                  value={serviceDraft.name}
                  onChange={(event) => handleItemDraftChange('service', 'name', event.target.value)}
                  placeholder="Service name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceDraft.currentPrice}
                  onChange={(event) =>
                    handleItemDraftChange('service', 'currentPrice', event.target.value)
                  }
                  placeholder="Price"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem('service')}
                  className="rounded-lg bg-[#3878c2] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Add Service
                </button>
              </div>

              <div className="mb-4 flex items-center border-b border-gray-100 pb-3 text-sm font-normal text-[#374151]">
                <span className="flex-[1.5] text-left">Services</span>
                <span className="flex-1 text-left">Current Price</span>
                <span className="flex-1 text-left">Previous Price</span>
                <div className="w-28"></div>
              </div>
              <div className="space-y-4">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center rounded-xl border border-gray-100 px-3 py-3">
                    <span className="flex-[1.5] text-left text-sm font-semibold text-gray-800">
                      {s.name}
                    </span>
                    <span className="flex-1 text-left text-sm font-semibold text-[#3878c2]">
                      ₱{s.currentPrice.toFixed(2)}
                    </span>
                    <span className="flex-1 text-left text-sm font-medium text-gray-400">
                      {s.previousPrice ? `₱${s.previousPrice.toFixed(2)}` : '-'}
                    </span>
                    <div className="w-28 flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick('service', s)}
                        className="rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10"
                        aria-label={`Edit ${s.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRevert('service', s)}
                        disabled={s.previousPrice === null}
                        className={`rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10 ${
                          s.previousPrice === null
                            ? 'opacity-20 cursor-not-allowed'
                            : 'opacity-100'
                        }`}
                        aria-label={`Revert ${s.name} price`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem('service', s)}
                        className="rounded-xl p-2 text-red-500 transition-all hover:bg-red-50"
                        aria-label={`Delete ${s.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Add-Ons Section */}
          <section className="rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#3878c2]">Add-Ons</h2>
            <div className="w-full">
              <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1.6fr_1fr_auto]">
                <input
                  type="text"
                  value={addOnDraft.name}
                  onChange={(event) => handleItemDraftChange('addon', 'name', event.target.value)}
                  placeholder="Add-on name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addOnDraft.currentPrice}
                  onChange={(event) =>
                    handleItemDraftChange('addon', 'currentPrice', event.target.value)
                  }
                  placeholder="Price"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem('addon')}
                  className="rounded-lg bg-[#3878c2] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Add Add-On
                </button>
              </div>

              <div className="mb-4 flex items-center border-b border-gray-100 pb-3 text-sm font-normal text-[#374151]">
                <span className="flex-[1.5] text-left">Add-On</span>
                <span className="flex-1 text-left">Current Price</span>
                <span className="flex-1 text-left">Previous Price</span>
                <div className="w-28"></div>
              </div>
              <div className="space-y-4">
                {addOns.map((item) => (
                  <div key={item.id} className="flex items-center rounded-xl border border-gray-100 px-3 py-3">
                    <span className="flex-[1.5] text-left text-sm font-semibold text-gray-800">
                      {item.name}
                    </span>
                    <span className="flex-1 text-left text-sm font-semibold text-[#3878c2]">
                      ₱{item.currentPrice.toFixed(2)}
                    </span>
                    <span className="flex-1 text-left text-sm font-medium text-gray-400">
                      {item.previousPrice ? `₱${item.previousPrice.toFixed(2)}` : '-'}
                    </span>
                    <div className="w-28 flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick('addon', item)}
                        className="rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10"
                        aria-label={`Edit ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRevert('addon', item)}
                        disabled={item.previousPrice === null}
                        className={`rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10 ${
                          item.previousPrice === null
                            ? 'opacity-20 cursor-not-allowed'
                            : 'opacity-100'
                        }`}
                        aria-label={`Revert ${item.name} price`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem('addon', item)}
                        className="rounded-xl p-2 text-red-500 transition-all hover:bg-red-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Schedule Section */}
          <section className="rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#3878c2]">Schedule</h2>
            <div className="w-full">
              <div className="mb-4 flex items-center border-b border-gray-100 pb-3 text-sm font-normal text-[#374151]">
                <span className="flex-[2.25] text-left">Open</span>
                <span className="flex-1 text-left">Close</span>
                <div className="w-20"></div>
              </div>
              <div className="flex items-center rounded-xl border border-gray-100 px-3 py-3">
                <span className="flex-[2.25] text-left text-sm font-semibold text-gray-800">
                  {schedule.opens}
                </span>
                <span className="flex-1 text-left text-sm font-semibold text-gray-800">{schedule.closes}</span>
                <div className="w-20 flex justify-end gap-3">
                  <button
                    onClick={() => handleEditClick('schedule')}
                    className="rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10"
                    aria-label="Edit schedule"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRevert('schedule')}
                    disabled={!previousSchedule}
                    className={`rounded-xl p-2 text-gray-600 transition-all hover:bg-[#3878c2]/10 ${
                      !previousSchedule ? 'opacity-20 cursor-not-allowed' : 'opacity-100'
                    }`}
                    aria-label="Revert schedule"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#3878c2]">Manage FAQs</h2>

            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <input
                type="text"
                value={faqDraft.question}
                onChange={(event) => handleFaqInputChange('question', event.target.value)}
                placeholder="FAQ question"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
              />
              <textarea
                value={faqDraft.answer}
                onChange={(event) => handleFaqInputChange('answer', event.target.value)}
                placeholder="FAQ answer"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFaq}
                  className="rounded-lg bg-[#3878c2] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  {editingFaqId ? 'Update FAQ' : 'Add FAQ'}
                </button>
                {editingFaqId && (
                  <button
                    onClick={resetFaqForm}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {faqs.length > 0 ? (
                faqs.map((faq, index) => (
                  <div key={faq.id} className="rounded-xl border border-gray-100 p-3">
                    <p className="text-sm font-semibold text-gray-800">{faq.question}</p>
                    <p className="mt-1 text-xs text-gray-600">{faq.answer}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleMoveFaq(index, 'up')}
                        disabled={index === 0}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          index === 0
                            ? 'cursor-not-allowed border-gray-100 text-gray-300'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Up
                      </button>
                      <button
                        onClick={() => handleMoveFaq(index, 'down')}
                        disabled={index === faqs.length - 1}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          index === faqs.length - 1
                            ? 'cursor-not-allowed border-gray-100 text-gray-300'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Down
                      </button>
                      <button
                        onClick={() => handleEditFaq(faq)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs italic text-gray-400">No FAQs yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#3878c2]">Terms &amp; Conditions</h2>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Upload file
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleTermsFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#3878c2] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:opacity-90"
              />

              {selectedTermsFile && (
                <p className="mt-2 text-xs text-gray-600">
                  Selected: <span className="font-semibold">{selectedTermsFile.name}</span>
                </p>
              )}

              <button
                onClick={handleUploadTerms}
                className="mt-3 rounded-lg bg-[#3878c2] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                {termsDocument ? 'Replace Terms File' : 'Upload Terms File'}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current file</p>
              {termsDocument ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-gray-800">{termsDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    Size: {(termsDocument.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-gray-500">Last updated: {termsDocument.uploadedAt}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-gray-400">No terms file uploaded yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#3878c2]/20 bg-white p-5 shadow-sm">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            Edit History <span className="relative top-[-4px] text-xs text-[#3878c2]">{history.length}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isHistoryOpen && (
            <div className="mt-4 max-h-60 overflow-y-auto rounded-xl bg-gray-50 p-4">
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="text-left border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[#3878c2]">{log.message}</span>
                        <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-600">{log.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs text-gray-400 italic">No edit history found.</div>
              )}
            </div>
          )}
        </section>

        {isEditModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-[#3878c2]">
                {editType === 'service' || editType === 'addon' ? `Edit ${editItem?.name} Price` : 'Edit Schedule'}
              </h3>

              {editType === 'service' || editType === 'addon' ? (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editItem?.currentPrice ?? 0}
                    onChange={(event) =>
                      setEditItem((prev) => ({ ...prev, currentPrice: Number(event.target.value) }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Open</label>
                    <input
                      type="time"
                      value={editItem?.opens || ''}
                      onChange={(event) =>
                        setEditItem((prev) => ({ ...prev, opens: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Close</label>
                    <input
                      type="time"
                      value={editItem?.closes || ''}
                      onChange={(event) =>
                        setEditItem((prev) => ({ ...prev, closes: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3878c2] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="rounded-lg bg-[#3878c2] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-gray-800">Confirm changes</h3>
              <p className="mt-2 text-sm text-gray-600">Apply these updates?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="rounded-lg bg-[#3878c2] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-gray-800">Confirm delete</h3>
              <p className="mt-2 text-sm text-gray-600">
                Delete {pendingDelete?.item?.name || 'this item'}?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setPendingDelete(null);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalDelete}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed right-4 top-4 z-50 rounded-xl bg-[#3878c2] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Changes saved successfully
          </div>
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
