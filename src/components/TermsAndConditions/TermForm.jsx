// components/admin/TermsAndConditions/TermsForm.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Save, X, Plus, Trash2, Calendar, Building, Droplets,
  Check, AlertCircle, Upload, FileText, Download
} from "lucide-react";

// --- Memoized Term Item Component ---
const TermItem = React.memo(({
  term,
  index,
  isFirst,
  isLast,
  onTermChange,
  onRemove,
  onMove,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const handleTitleChange = useCallback((e) => {
    onTermChange(index, "title", e.target.value);
  }, [index, onTermChange]);

  const handleDescriptionChange = useCallback((e) => {
    onTermChange(index, "description", e.target.value);
  }, [index, onTermChange]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  const handleMoveUp = useCallback(() => {
    onMove(index, index - 1);
  }, [index, onMove]);

  const handleMoveDown = useCallback(() => {
    onMove(index, index + 1);
  }, [index, onMove]);

  const handleToggleActive = useCallback(() => {
    onToggleActive(index);
  }, [index, onToggleActive]);

  const handleDragStartLocal = useCallback((e) => {
    onDragStart(e, index);
  }, [index, onDragStart]);

  const handleDragOverLocal = useCallback((e) => {
    onDragOver(e);
  }, [onDragOver]);

  const handleDragLeaveLocal = useCallback((e) => {
    onDragLeave(e);
  }, [onDragLeave]);

  const handleDropLocal = useCallback((e) => {
    onDrop(e, index);
  }, [index, onDrop]);

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        term.isActive 
          ? "border-gray-200 bg-white hover:border-gray-300" 
          : "border-gray-100 bg-gray-50 opacity-75"
      }`}
      draggable
      onDragStart={handleDragStartLocal}
      onDragOver={handleDragOverLocal}
      onDragLeave={handleDragLeaveLocal}
      onDrop={handleDropLocal}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold cursor-move"
            draggable
            title="Drag to reorder"
          >
            {term.pointNumber}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Term {term.pointNumber}</h3>
            <p className="text-sm text-gray-500">
              {term.isActive ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check size={12} /> Active
                </span>
              ) : (
                <span className="text-gray-400">Inactive</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={`p-2 rounded ${
              term.isActive
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-400 hover:bg-gray-100"
            }`}
            title={term.isActive ? "Deactivate" : "Activate"}
          >
            {term.isActive ? <Check size={18} /> : <X size={18} />}
          </button>
          
          <div className="flex gap-1">
            <button
              onClick={handleMoveUp}
              disabled={isFirst}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={handleMoveDown}
              disabled={isLast}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Move down"
            >
              ↓
            </button>
          </div>
          
          <button
            onClick={handleRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Remove term"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={term.title}
            onChange={handleTitleChange}
            placeholder="e.g., Charges for Children"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={term.description}
            onChange={handleDescriptionChange}
            rows={3}
            placeholder="Detailed description of this term..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-xs text-gray-500 mt-1">
            {term.description.length} characters
          </div>
        </div>
      </div>
    </div>
  );
});

// --- Main Component ---
const TermsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: "location",
    title: "",
    description: "",
    terms: [
      { pointNumber: 1, title: "", description: "", isActive: true }
    ],
    appliedLocations: [],
    appliedPoolParties: [],
    applyToAll: false,
    status: "draft",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveUntil: ""
  });
  
  // Available items for selection
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [parsedTerms, setParsedTerms] = useState([]);
  const [importStep, setImportStep] = useState("paste"); // paste, preview, confirm
  
  // Drag and drop ref to avoid re-renders
  const draggedIndex = useRef(null);

  // Quick templates
  const quickTemplates = {
    resort: `1. Charges for Children: Children aged between 5 and 8 years will be charged at half rate.
2. Charges for Adults: Individuals above 8 years will be charged at the full rate.
3. Advance Payment: Entry to the resort is permitted only after the advance payment is cleared.
4. Cancellation Policy: No refunds will be issued for canceled bookings.
5. Personal Responsibility: Participation in activities and use of the swimming pool is at the individual's own risk. The resort is not liable for any injuries or accidents.
6. Prohibited Activities: Alcohol consumption and illegal activities are strictly prohibited within the resort.
7. Swimming Pool Guidelines: Individuals with skin problems or allergies should refrain from using the swimming pool.
8. Meal Timings: Breakfast: 9:00 AM to 10:00 AM, Lunch: 12:00 PM to 1:00 PM, Evening Snacks: 4:00 PM to 5:00 PM, Dinner: 8:00 PM to 10:00 PM
9. Group Activities: Horse riding and bullock cart rides require a minimum of 25 participants. Otherwise, they may be offered to other groups at no charge.
10. Swimming Pool Depth: The swimming pool has a depth of 4 feet.
11. Government Guidelines: Compliance with all relevant government guidelines is mandatory.
12. Behavioral Conduct: Individuals causing disturbances will be promptly removed from the resort.
13. Contact Information: Resort helpline numbers are +91 8980688555 and +91 9099048961.
14. Adventure Activities: Available only to individuals aged 18 and above.
15. Personal Belongings: Guests are responsible for the security of their personal belongings.
16. Pre-Entry Requirements: The booking party must undergo a full check prior to service; subsequent disputes will not be addressed.
17. Identification: Wearing a wristband is mandatory; those without will be asked to leave.
18. Identification for Children: Children under 5 must present ID, with guardians assuming responsibility.
19. Activity Participation: All activities are available to all guests.
20. Accommodation Charges: Charges for AC, non-AC rooms, or private villas are separate and must be settled accordingly.
21. Check-In and Entry: Check-in is from 9:00 AM to 9:00 PM. No entry after 10:00 PM.
22. Booking Information: A name and contact number are required for all bookings.
23. Handling Issues: Guests should address any concerns calmly with on-site staff. Aggressive behavior will not be tolerated.`,
    
    basic: `1. Booking Confirmation: All bookings are confirmed only after full payment is received.
2. Cancellation: No refunds for cancellations made less than 48 hours before check-in.
3. Check-in/Check-out: Check-in at 2:00 PM, Check-out at 11:00 AM.
4. Guest Responsibility: Guests are responsible for any damage to property.
5. Smoking: Smoking is prohibited in all indoor areas.
6. Pets: Pets are not allowed.
7. Quiet Hours: Quiet hours from 10:00 PM to 7:00 AM.
8. Maximum Guests: Maximum occupancy as per booking confirmation.
9. Parking: Free parking available for one vehicle.
10. Housekeeping: Daily housekeeping service provided.`
  };
  
  // --- Data fetching functions (memoized) ---
  const fetchTermsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/terms-and-conditions/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          ...data.data,
          effectiveFrom: data.data.effectiveFrom 
            ? new Date(data.data.effectiveFrom).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          effectiveUntil: data.data.effectiveUntil 
            ? new Date(data.data.effectiveUntil).toISOString().split("T")[0]
            : ""
        });
        
        // Set selected items based on the fetched data type
        const items = data.data.type === "location" 
          ? data.data.appliedLocations 
          : data.data.appliedPoolParties;
        setSelectedItems(items.map(item => item._id));
      }
    } catch (error) {
      toast.error("Failed to load terms data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, API_BASE_URL]);

  const fetchAvailableItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/terms-and-conditions/items?type=${formData.type}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableItems(data.data);
      }
    } catch (error) {
      // Log error but don't show toast to avoid spamming user
      console.error("Failed to load available items:", error);
    }
  }, [formData.type, API_BASE_URL]);
  
  // Load data if editing
  useEffect(() => {
    if (id) {
      fetchTermsData();
    }
  }, [id, fetchTermsData]);

  // Fetch available items when type changes
  useEffect(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);
  
  // --- Form handlers (memoized) ---
  const handleBasicInfoChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset selected items when type changes
    if (field === "type") {
      setSelectedItems([]);
      setFormData(prev => ({
        ...prev,
        appliedLocations: [],
        appliedPoolParties: []
      }));
    }
  }, []);
  
  const handleTermChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updatedTerms = [...prev.terms];
      updatedTerms[index] = { ...updatedTerms[index], [field]: value };
      return { ...prev, terms: updatedTerms };
    });
  }, []);
  
  const addTerm = useCallback(() => {
    setFormData(prev => {
      const newTermNumber = prev.terms.length + 1;
      return {
        ...prev,
        terms: [
          ...prev.terms,
          { pointNumber: newTermNumber, title: "", description: "", isActive: true }
        ]
      };
    });
  }, []);
  
  const removeTerm = useCallback((index) => {
    setFormData(prev => {
      if (prev.terms.length <= 1) {
        toast.error("At least one term is required");
        return prev;
      }
      
      const updatedTerms = prev.terms.filter((_, i) => i !== index);
      // Renumber remaining terms
      updatedTerms.forEach((term, idx) => {
        term.pointNumber = idx + 1;
      });
      
      return { ...prev, terms: updatedTerms };
    });
  }, []);
  
  // Move term by index swapping (supports both arrow buttons and drag-drop)
  const moveTerm = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    setFormData(prev => {
      const updatedTerms = [...prev.terms];
      const [draggedTerm] = updatedTerms.splice(fromIndex, 1);
      updatedTerms.splice(toIndex, 0, draggedTerm);
      
      // Renumber
      updatedTerms.forEach((term, idx) => {
        term.pointNumber = idx + 1;
      });
      
      return { ...prev, terms: updatedTerms };
    });
  }, []);
  
  const toggleTermActive = useCallback((index) => {
    setFormData(prev => {
      const updatedTerms = [...prev.terms];
      updatedTerms[index].isActive = !updatedTerms[index].isActive;
      return { ...prev, terms: updatedTerms };
    });
  }, []);
  
  const handleItemSelect = useCallback((itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);
  
  const selectAllItems = useCallback(() => {
    setSelectedItems(availableItems.map(item => item._id));
  }, [availableItems]);
  
  const clearAllItems = useCallback(() => {
    setSelectedItems([]);
  }, []);
  
  const validateForm = useCallback(() => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    
    if (!formData.type) {
      toast.error("Type is required");
      return false;
    }
    
    // Validate terms
    for (let i = 0; i < formData.terms.length; i++) {
      const term = formData.terms[i];
      if (!term.title.trim() || !term.description.trim()) {
        toast.error(`Term ${i + 1} is missing title or description`);
        return false;
      }
    }
    
    // Validate applied items if not applying to all
    if (!formData.applyToAll && selectedItems.length === 0) {
      toast.error("Please select at least one item to apply these terms to");
      return false;
    }
    
    return true;
  }, [formData.title, formData.type, formData.terms, formData.applyToAll, selectedItems.length]);
  
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Prepare data
      const submitData = {
        ...formData,
        appliedLocations: formData.type === "location" ? selectedItems : [],
        appliedPoolParties: formData.type === "poolParty" ? selectedItems : []
      };
      
      const url = id ? `${API_BASE_URL}/terms-and-conditions/${id}` : `${API_BASE_URL}/terms-and-conditions`;
      const method = id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(id ? "Terms updated successfully" : "Terms created successfully");
        navigate("/admin/terms");
      } else {
        toast.error(data.error || "Failed to save terms");
      }
    } catch (error) {
      toast.error("Error saving terms");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData, selectedItems, id, API_BASE_URL, navigate]);
  
  // Item display name (memoized per item, but we'll compute on render)
  const getItemDisplayName = useCallback((item) => {
    if (formData.type === "location") {
      return `${item.name} - ${item.address?.city || "Unknown City"}`;
    } else {
      return `${item.name} (${item.locationName || item.locationId?.name || "Unknown"})`;
    }
  }, [formData.type]);

  // --- Drag and drop handlers (using ref) ---
  const handleDragStart = useCallback((e, index) => {
    draggedIndex.current = index;
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-200');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
    const sourceIndex = draggedIndex.current;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      moveTerm(sourceIndex, targetIndex);
    }
    draggedIndex.current = null;
  }, [moveTerm]);

  // --- Import functions (memoized) ---
  const parsePDFText = useCallback((text) => {
    const lines = text.split('\n');
    const terms = [];
    let currentTerm = null;
    let currentNumber = 1;
    
    const cleanupText = (str) => {
      return str
        .replace(/\s+/g, ' ')
        .replace(/\s*:\s*/g, ': ')
        .trim();
    };
    
    lines.forEach((line, index) => {
      line = cleanupText(line);
      if (!line) return;
      
      // Skip page headers/footers
      if (line.match(/^Page\s+\d+/i) || 
          line.match(/^=====.*=====$/) ||
          line === '[file content begin]' ||
          line === '[file content end]') {
        return;
      }
      
      // Look for numbered terms (can be "1.", "23.", "1)", etc.)
      const numberMatch = line.match(/^(\d+)[.)]\s*(.+)/); // Fixed regex: removed unnecessary escapes
      
      if (numberMatch) {
        // Save previous term if exists
        if (currentTerm) {
          terms.push(currentTerm);
        }
        
        const [, number, content] = numberMatch;
        currentNumber = parseInt(number);
        
        // Try to split by colon
        const colonIndex = content.indexOf(':');
        let title, description;
        
        if (colonIndex > -1) {
          title = content.substring(0, colonIndex).trim();
          description = content.substring(colonIndex + 1).trim();
        } else {
          // No colon, maybe the title is short and description continues
          title = content;
          description = '';
          
          // Check if next line might be continuation
          const nextLine = index + 1 < lines.length ? cleanupText(lines[index + 1]) : '';
          if (nextLine && !nextLine.match(/^\d+[.)]/)) { // Fixed regex
            description = nextLine;
            lines[index + 1] = ''; // Mark as processed
          }
        }
        
        currentTerm = {
          pointNumber: currentNumber,
          title: title || `Term ${currentNumber}`,
          description: description,
          isActive: true
        };
      } else if (currentTerm) {
        // This is a continuation line for current term
        if (currentTerm.description) {
          currentTerm.description += ' ' + line;
        } else {
          currentTerm.description = line;
        }
      } else if (line.trim()) {
        // Unnumbered line at start - create a term for it
        terms.push({
          pointNumber: currentNumber,
          title: `Term ${currentNumber}`,
          description: line,
          isActive: true
        });
        currentNumber++;
      }
    });
    
    // Don't forget the last term
    if (currentTerm) {
      terms.push(currentTerm);
    }
    
    return terms;
  }, []);

  const handleQuickImport = useCallback((template) => {
    setImportText(quickTemplates[template]);
    toast.success(`Loaded ${template} template`);
  }, [quickTemplates]); // Added quickTemplates dependency

  const handleParseText = useCallback(() => {
    if (!importText.trim()) {
      toast.error("Please paste some text to parse");
      return;
    }
    
    const parsed = parsePDFText(importText);
    
    if (parsed.length === 0) {
      toast.error("Could not find any numbered terms in the text");
      return;
    }
    
    setParsedTerms(parsed);
    setImportStep("preview");
    toast.success(`Found ${parsed.length} terms`);
  }, [importText, parsePDFText]);

  const handleImportConfirm = useCallback((action = "replace") => {
    setFormData(prev => {
      let newTerms = [];
      if (action === "replace") {
        newTerms = parsedTerms;
      } else if (action === "append") {
        const startNumber = prev.terms.length + 1;
        newTerms = [
          ...prev.terms,
          ...parsedTerms.map((term, idx) => ({
            ...term,
            pointNumber: startNumber + idx
          }))
        ];
      }
      return { ...prev, terms: newTerms };
    });
    
    setImportModalOpen(false);
    setImportText("");
    setParsedTerms([]);
    setImportStep("paste");
    
    toast.success(`Imported ${parsedTerms.length} terms`);
  }, [parsedTerms]);

  const resetImport = useCallback(() => {
    setImportText("");
    setParsedTerms([]);
    setImportStep("paste");
  }, []);

  const exportTerms = useCallback(() => {
    const exportData = {
      title: formData.title || "Terms and Conditions",
      description: formData.description || "",
      terms: formData.terms.map(term => `${term.pointNumber}. ${term.title}: ${term.description}`).join('\n\n')
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terms-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Terms exported successfully");
  }, [formData.title, formData.description, formData.terms]);

  // --- Memoized derived values ---
  const termStats = useMemo(() => ({
    total: formData.terms.length,
    active: formData.terms.filter(t => t.isActive).length
  }), [formData.terms]);

  const previewTerms = useMemo(() => 
    formData.terms.slice(0, 3).map((term, idx) => ({
      key: idx,
      pointNumber: term.pointNumber,
      title: term.title,
      description: term.description
    }))
  , [formData.terms]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Import Modal - unchanged except for Tailwind class fix */}
     {/* Import Modal */}
{importModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => {
        setImportModalOpen(false);
        resetImport();
      }}
    />
    
    {/* Modal container - now using flex column */}
    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header - fixed */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Import Terms from PDF/Text</h3>
          <p className="text-sm text-gray-600 mt-1">
            {importStep === "paste" 
              ? "Paste your PDF text or use a template" 
              : importStep === "preview"
              ? `Preview ${parsedTerms.length} parsed terms`
              : "Confirm import"}
          </p>
        </div>
        <button
          onClick={() => {
            setImportModalOpen(false);
            resetImport();
          }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Content - scrollable area, takes remaining space */}
      <div className="flex-1 p-6 overflow-y-auto">
        {importStep === "paste" && (
          <div className="space-y-6">
            {/* Quick Templates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quick Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickImport("resort")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Resort Terms</div>
                  <div className="text-sm text-gray-600 mt-1">23 common resort terms</div>
                </button>
                <button
                  onClick={() => handleQuickImport("basic")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Basic Terms</div>
                  <div className="text-sm text-gray-600 mt-1">10 basic property terms</div>
                </button>
              </div>
            </div>
            
            {/* Text Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Paste your text below *
                </label>
                <span className="text-xs text-gray-500">
                  {importText.length} characters
                </span>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={12}
                placeholder={`Example format:
1. Title: Description text here.
2. Another Title: Another description.
3. Title without colon, description continues on next line.
   This is continuation text.

Make sure each term starts with a number followed by a dot or parenthesis.`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            
            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <h5 className="font-medium text-blue-800 mb-2">How to format your text</h5>
                  <ul className="list-disc pl-4 text-blue-700 space-y-1">
                    <li>Each term should start with a number (e.g., "1.", "23.", "1)")</li>
                    <li>Use colons (:) to separate titles from descriptions</li>
                    <li>Indent continuation lines with spaces</li>
                    <li>Blank lines separate terms</li>
                    <li>Skip page numbers and headers (e.g., "Page 1", "=====")</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {importStep === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Preview {parsedTerms.length} Parsed Terms
              </h4>
              <button
                onClick={() => setImportStep("paste")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Back to edit
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedTerms.map((term, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {term.pointNumber}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {term.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {term.description.length > 100
                            ? `${term.description.substring(0, 100)}...`
                            : term.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check size={20} className="text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <h5 className="font-medium text-green-800 mb-2">Ready to import</h5>
                  <p className="text-green-700">
                    Found {parsedTerms.length} terms. Choose how you want to import them:
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer - fixed */}
      <div className="flex justify-between gap-3 p-6 border-t bg-gray-50">
        {importStep === "paste" ? (
          <>
            <button
              onClick={() => {
                setImportModalOpen(false);
                resetImport();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleParseText}
              disabled={!importText.trim()}
              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Parse & Preview →
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <button
                onClick={() => handleImportConfirm("replace")}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Replace All Terms
              </button>
              <button
                onClick={() => handleImportConfirm("append")}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Append to Existing
              </button>
            </div>
            <button
              onClick={resetImport}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Start Over
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? "Edit Terms and Conditions" : "Create New Terms and Conditions"}
              </h1>
              <p className="text-gray-600">
                {id 
                  ? "Update the terms and conditions details" 
                  : "Create new terms and conditions for locations or pool parties"}
              </p>
            </div>
            <button
              onClick={exportTerms}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Info & Terms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleBasicInfoChange("type", "location")}
                      className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
                        formData.type === "location"
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Building className={`w-6 h-6 mb-2 ${
                        formData.type === "location" ? "text-blue-600" : "text-gray-400"
                      }`} />
                      <span className={`font-medium ${
                        formData.type === "location" ? "text-blue-700" : "text-gray-700"
                      }`}>
                        Location
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Terms for locations</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleBasicInfoChange("type", "poolParty")}
                      className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
                        formData.type === "poolParty"
                          ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Droplets className={`w-6 h-6 mb-2 ${
                        formData.type === "poolParty" ? "text-purple-600" : "text-gray-400"
                      }`} />
                      <span className={`font-medium ${
                        formData.type === "poolParty" ? "text-purple-700" : "text-gray-700"
                      }`}>
                        Pool Party
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Terms for pool parties</span>
                    </button>
                  </div>
                </div>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleBasicInfoChange("title", e.target.value)}
                    placeholder="e.g., Standard Terms for Locations"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleBasicInfoChange("description", e.target.value)}
                    rows={3}
                    placeholder="Brief description of these terms..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Effective Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective From *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) => handleBasicInfoChange("effectiveFrom", e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Until (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="date"
                        value={formData.effectiveUntil}
                        onChange={(e) => handleBasicInfoChange("effectiveUntil", e.target.value)}
                        min={formData.effectiveFrom}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleBasicInfoChange("status", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Terms List Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Terms Points</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50"
                  >
                    <Upload size={18} />
                    Import from PDF
                  </button>
                  <button
                    onClick={addTerm}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <Plus size={18} />
                    Add Term
                  </button>
                </div>
              </div>
              
              {/* Terms Count Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Total Terms: {termStats.total}
                    </span>
                    <span className="text-sm text-gray-500 ml-4">
                      Active: {termStats.active}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Drag terms to reorder
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {formData.terms.map((term, index) => (
                  <TermItem
                    key={term.pointNumber}
                    term={term}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === formData.terms.length - 1}
                    onTermChange={handleTermChange}
                    onRemove={removeTerm}
                    onMove={moveTerm}
                    onToggleActive={toggleTermActive}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
              
              {formData.terms.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Terms Added Yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding terms manually or import from a PDF</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setImportModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Import from PDF
                    </button>
                    <button
                      onClick={addTerm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add First Term
                    </button>
                  </div>
                </div>
              )}
              
              {/* Bulk Actions */}
              {formData.terms.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {termStats.total} terms total
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allActive = formData.terms.every(t => t.isActive);
                          const updatedTerms = formData.terms.map(term => ({
                            ...term,
                            isActive: !allActive
                          }));
                          setFormData(prev => ({ ...prev, terms: updatedTerms }));
                          toast.success(allActive ? "All terms deactivated" : "All terms activated");
                        }}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {formData.terms.every(t => t.isActive) ? "Deactivate All" : "Activate All"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Clear all terms? This cannot be undone.")) {
                            setFormData(prev => ({ ...prev, terms: [] }));
                            toast.success("All terms cleared");
                          }
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Item Selection */}
          <div className="space-y-6">
            {/* Apply To Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Apply To {formData.type === "location" ? "Locations" : "Pool Parties"}
              </h2>
              
              <div className="space-y-4">
                {/* Apply to All Option */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="applyToAll"
                      checked={formData.applyToAll}
                      onChange={(e) => handleBasicInfoChange("applyToAll", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="applyToAll" className="font-medium text-gray-900">
                        Apply to All
                      </label>
                      <p className="text-sm text-gray-500">
                        Apply these terms to all {formData.type === "location" ? "locations" : "pool parties"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!formData.applyToAll && (
                  <>
                    {/* Selection Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllItems}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllItems}
                        className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Search Items - placeholder, not functional to match original */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Search ${formData.type === "location" ? "locations" : "pool parties"}...`}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={() => {}}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Items List */}
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {availableItems.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No {formData.type === "location" ? "locations" : "pool parties"} available
                        </div>
                      ) : (
                        availableItems.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleItemSelect(item._id)}
                            className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                              selectedItems.includes(item._id)
                                ? "bg-blue-50 border-blue-200"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedItems.includes(item._id)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300"
                              }`}>
                                {selectedItems.includes(item._id) && (
                                  <Check size={12} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {getItemDisplayName(item)}
                                </p>
                                {formData.type === "location" && (
                                  <p className="text-sm text-gray-500">
                                    Capacity: {item.capacityOfPersons} persons
                                  </p>
                                )}
                                {formData.type === "poolParty" && (
                                  <p className="text-sm text-gray-500 capitalize">
                                    Type: {item.type || 'private'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Selection Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800">
                        {selectedItems.length} {formData.type === "location" ? "locations" : "pool parties"} selected
                      </p>
                      {selectedItems.length === 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          Please select at least one item to apply these terms
                        </p>
                      )}
                      {selectedItems.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {formData.applyToAll ? 'Applied to all items' : 'Applied to selected items only'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Preview Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <div className="flex items-center gap-2">
                    {formData.type === "location" ? (
                      <>
                        <Building className="w-4 h-4 text-blue-500" />
                        <p className="font-medium text-gray-900">Location Terms</p>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-4 h-4 text-purple-500" />
                        <p className="font-medium text-gray-900">Pool Party Terms</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    formData.status === "draft" ? "bg-gray-100 text-gray-800" :
                    formData.status === "active" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {formData.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Effective From</p>
                  <p className="font-medium text-gray-900">
                    {new Date(formData.effectiveFrom).toLocaleDateString()}
                  </p>
                </div>
                
                {formData.effectiveUntil && (
                  <div>
                    <p className="text-sm text-gray-600">Effective Until</p>
                    <p className="font-medium text-gray-900">
                      {new Date(formData.effectiveUntil).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Applied To</p>
                  <p className="font-medium text-gray-900">
                    {formData.applyToAll 
                      ? `All ${formData.type === "location" ? "locations" : "pool parties"}`
                      : `${selectedItems.length} ${formData.type === "location" ? "location(s)" : "pool party(ies)"}`
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Terms Count</p>
                  <p className="font-medium text-gray-900">
                    {termStats.total} point{termStats.total !== 1 ? "s" : ""}
                    <span className="text-gray-500 ml-2">
                      ({termStats.active} active)
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Quick Preview of Terms */}
              {formData.terms.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Sample Terms</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {previewTerms.map((term) => (
                      <div key={term.key} className="text-sm">
                        <p className="font-medium text-gray-900 truncate">
                          {term.pointNumber}. {term.title}
                        </p>
                        <p className="text-gray-600 text-xs truncate">
                          {term.description}
                        </p>
                      </div>
                    ))}
                    {formData.terms.length > 3 && (
                      <p className="text-xs text-gray-500">
                        + {formData.terms.length - 3} more terms
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {id ? "Update Terms" : "Create Terms"}
                    </>
                  )}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate("/admin/terms")}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Save as draft and continue later?")) {
                        handleBasicInfoChange("status", "draft");
                        handleSubmit();
                      }
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
              
              {/* Validation Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Title</span>
                    {formData.title.trim() ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Terms Count</span>
                    <span className={`font-medium ${formData.terms.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.terms.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Applied Items</span>
                    <span className={`font-medium ${formData.applyToAll || selectedItems.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.applyToAll ? 'All' : selectedItems.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsForm;