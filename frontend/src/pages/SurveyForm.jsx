import React, { useState, useRef } from 'react';
import { createSurvey, listLocations, parseOcrText } from '../api/client';
import { getUrgencyColour, categoryIcon } from '../utils/urgency';
import toast from 'react-hot-toast';

const CATEGORIES = ['medical', 'food', 'water', 'shelter', 'education'];

const LEVEL_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Critical',
};

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#8b949e',
        marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#f0f6fc',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const inputFocusStyle = { borderColor: '#00D2B4' };

function Input({ value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function SurveyForm() {
  const [form, setForm] = useState({
    location_id: '',
    reported_by: '',
    category: 'medical',
    urgency_level: 3,
    affected_people: '',
    description: '',
  });
  const [locations, setLocations]   = useState([]);
  const [ocrStatus, setOcrStatus]   = useState('idle'); // idle | running | done | error
  const [ocrPreview, setOcrPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const fileRef = useRef(null);

  React.useEffect(() => {
    listLocations()
      .then(setLocations)
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrPreview(URL.createObjectURL(file));
    setOcrStatus('running');

    try {
      // Step 1: Extract raw text client-side with Tesseract.js (no server needed)
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng');
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const rawText = data.text || '';
      if (!rawText.trim()) {
        setOcrStatus('error');
        toast.error('Could not read text from the image — please fill manually.');
        return;
      }

      // Step 2: Send raw text to backend → Gemini extracts structured fields
      toast.loading('Gemini is reading your survey…', { id: 'ocr' });
      const { extracted_fields } = await parseOcrText(rawText);
      toast.dismiss('ocr');

      const {
        category: detectedCategory,
        affected_people: detectedPeople,
        urgency_level: detectedUrgency,
        ward_name: detectedWard,
        block: detectedBlock,
        district: detectedDistrict,
        description: detectedDesc,
      } = extracted_fields || {};

      // Update form with extracted values
      setForm((f) => ({
        ...f,
        category:        detectedCategory  || f.category,
        affected_people: detectedPeople != null ? String(detectedPeople) : f.affected_people,
        urgency_level:   detectedUrgency   || f.urgency_level,
        description:     detectedDesc      || f.description,
      }));

      // Auto-match location from extracted district/block/ward_name
      if (locations.length > 0 && (detectedWard || detectedBlock || detectedDistrict)) {
        const needle = [detectedWard, detectedBlock, detectedDistrict]
          .filter(Boolean)
          .map((s) => s.toLowerCase().trim());

        const matched = locations.find((l) => {
          const hay = [l.ward_name, l.block, l.district]
            .filter(Boolean)
            .map((s) => s.toLowerCase().trim());
          return needle.some((n) => hay.some((h) => h.includes(n) || n.includes(h)));
        });

        if (matched) {
          set('location_id', matched.id);
          toast.success(`📍 Location matched: ${matched.ward_name}, ${matched.district}`);
        }
      }

      setOcrStatus('done');
      toast.success('Gemini OCR complete — review the fields below');
    } catch (err) {
      console.error(err);
      setOcrStatus('error');
      toast.error('OCR failed — please fill the form manually');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location_id) return toast.error('Please select a location.');
    if (!form.affected_people) return toast.error('Please enter affected people count.');

    setSubmitting(true);
    try {
      const created = await createSurvey({
        ...form,
        urgency_level: Number(form.urgency_level),
        affected_people: Number(form.affected_people),
      });
      setResult(created);
      toast.success(`Survey submitted — Task created!`);
      setForm({ location_id: '', reported_by: '', category: 'medical', urgency_level: 3, affected_people: '', description: '' });
      setOcrPreview(null);
      setOcrStatus('idle');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyColour = getUrgencyColour(form.urgency_level * 3 + 2);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #00D2B4, #0077aa)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              📋
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: '#f0f6fc',
              }}>
                Submit Community Survey
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#8b949e' }}>
                Upload a paper scan or fill manually
              </p>
            </div>
          </div>
        </div>

        {/* OCR upload zone */}
        <div style={{ marginBottom: 28 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${ocrStatus === 'done' ? '#00D2B4' : '#21262d'}`,
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: ocrStatus === 'done' ? 'rgba(0,210,180,0.04)' : '#161b22',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => { if (ocrStatus !== 'done') e.currentTarget.style.borderColor = '#484f58'; }}
            onMouseLeave={(e) => { if (ocrStatus !== 'done') e.currentTarget.style.borderColor = '#21262d'; }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            {ocrPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
                <img src={ocrPreview} alt="OCR preview" style={{ height: 64, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: ocrStatus === 'done' ? '#00D2B4' : ocrStatus === 'running' ? '#eab308' : '#8b949e',
                    marginBottom: 4,
                  }}>
                    {ocrStatus === 'running' ? '⟳ Extracting fields…' :
                     ocrStatus === 'done'    ? '✓ Fields extracted — review below' :
                     ocrStatus === 'error'   ? '✗ OCR failed' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#484f58' }}>Click to replace</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📸</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>
                  Upload Paper Survey Scan
                </div>
                <div style={{ fontSize: 13, color: '#8b949e' }}>
                  Tesseract OCR will auto-fill fields · JPG / PNG / WEBP
                </div>
              </>
            )}
          </div>

          {ocrStatus === 'running' && (
            <div style={{
              marginTop: 8,
              height: 3,
              background: '#21262d',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: '#00D2B4',
                borderRadius: 2,
                animation: 'ocrProgress 2s ease-in-out infinite',
              }} />
              <style>{`
                @keyframes ocrProgress {
                  0%   { width: 0%;   margin-left: 0; }
                  50%  { width: 70%;  margin-left: 0; }
                  100% { width: 0%;   margin-left: 100%; }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 14,
          padding: '28px 28px',
        }}>
          <FieldRow label="Location">
            <select
              value={form.location_id}
              onChange={(e) => set('location_id', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              required
            >
              <option value="">Select ward / block…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.ward_name} — {l.block}, {l.district}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="Reported By">
            <Input
              value={form.reported_by}
              onChange={(e) => set('reported_by', e.target.value)}
              placeholder="Field officer name (optional)"
            />
          </FieldRow>

          <FieldRow label="Category">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px',
                    background: form.category === cat ? 'rgba(0,210,180,0.12)' : '#0f1117',
                    border: `1px solid ${form.category === cat ? '#00D2B4' : '#21262d'}`,
                    borderRadius: 7,
                    color: form.category === cat ? '#00D2B4' : '#8b949e',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: form.category === cat ? 600 : 400,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {categoryIcon(cat)} {cat}
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow label={`Urgency Level — ${LEVEL_LABELS[form.urgency_level]}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <input
                type="range" min="1" max="5" step="1"
                value={form.urgency_level}
                onChange={(e) => set('urgency_level', Number(e.target.value))}
                style={{ flex: 1, accentColor: urgencyColour.bg }}
              />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 20,
                color: urgencyColour.bg,
                minWidth: 28,
                textAlign: 'center',
              }}>
                {form.urgency_level}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#484f58', marginTop: 4 }}>
              <span>Minimal</span><span>Critical</span>
            </div>
          </FieldRow>

          <FieldRow label="Affected People">
            <Input
              type="number"
              value={form.affected_people}
              onChange={(e) => set('affected_people', e.target.value)}
              placeholder="Number of people affected"
            />
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the situation — resources needed, access issues, contact details…"
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
              onFocus={(e) => e.target.style.borderColor = '#00D2B4'}
              onBlur={(e) => e.target.style.borderColor = '#21262d'}
            />
          </FieldRow>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px 0',
              background: submitting ? '#00a98f' : '#00D2B4',
              color: '#0f1117',
              border: 'none',
              borderRadius: 9,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.03em',
              transition: 'background 0.15s',
              marginTop: 4,
            }}
          >
            {submitting ? '⟳ Submitting…' : 'Submit Survey + Create Task →'}
          </button>
        </form>

        {/* Success result card */}
        {result && (
          <div className="animate-fade-up" style={{
            marginTop: 20,
            background: 'rgba(0,210,180,0.06)',
            border: '1px solid rgba(0,210,180,0.3)',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#00D2B4', marginBottom: 8 }}>
              ✓ Survey Submitted
            </div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 4 }}>
              Task: <span style={{ color: '#f0f6fc' }}>{result.task?.title}</span>
            </div>
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              Urgency Score:{' '}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: getUrgencyColour(result.survey?.urgency_score).bg,
              }}>
                {result.survey?.urgency_score?.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
