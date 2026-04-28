import React, { useState, useRef } from 'react'
import { useCRM } from '../../store/CRMContext'
import { Modal } from '../common/Modal'
import { parseCSV, exportToCSV, generateLeadId } from '../../utils/helpers'
import { CSV_TEMPLATE_HEADERS, LEAD_SOURCES, VERTICALS, NATURE_OF_BUSINESS, PRIORITIES, TEAM_MEMBERS } from '../../data/constants'

const FIELD_MAP = {
  'Contact Person': 'contactPerson', 'Company Name': 'companyName', 'Website': 'website',
  'Email ID': 'email', 'Phone Number': 'phone', 'City': 'city',
  'Lead Source': 'leadSource', 'Vertical': 'vertical',
  'Nature of Business': 'natureOfBusiness', 'Lead Owner': 'leadOwner',
  'Priority': 'priority', 'Notes': 'notes'
}

export default function BulkImport({ onClose }) {
  const { state, dispatch } = useCRM()
  const [step, setStep] = useState('upload') // upload, map, preview, done
  const [csvData, setCsvData] = useState(null)
  const [mapping, setMapping] = useState({})
  const [preview, setPreview] = useState([])
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  function downloadTemplate() {
    exportToCSV([Object.fromEntries(CSV_TEMPLATE_HEADERS.map(h => [h, '']))], 'lead-import-template')
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result)
      setCsvData({ headers, rows })
      // Auto-map
      const autoMap = {}
      headers.forEach(h => {
        const match = Object.keys(FIELD_MAP).find(k => k.toLowerCase() === h.toLowerCase() || FIELD_MAP[k] === h.toLowerCase().replace(/ /g, ''))
        if (match) autoMap[h] = FIELD_MAP[match]
      })
      setMapping(autoMap)
      setStep('map')
    }
    reader.readAsText(file)
  }

  function buildPreview() {
    const rows = csvData.rows.map((row, i) => {
      const mapped = {}
      Object.entries(mapping).forEach(([csvCol, field]) => { if (field) mapped[field] = row[csvCol] || '' })
      const errors = []
      if (!mapped.contactPerson) errors.push('Missing contact person')
      if (!mapped.email) errors.push('Missing email')
      else if (state.leads.find(l => l.email?.toLowerCase() === mapped.email?.toLowerCase())) errors.push('Duplicate email')
      return { ...mapped, _row: i + 2, _errors: errors }
    })
    setPreview(rows)
    setStep('preview')
  }

  function doImport() {
    const valid = preview.filter(r => !r._errors.length)
    const leads = valid.map(row => {
      const { _row, _errors, ...data } = row
      return {
        ...data,
        id: generateLeadId(),
        status: 'New',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser.name,
        convertedAt: null,
        opportunityId: null,
        lastActivityAt: null,
        leadSourceOther: ''
      }
    })
    dispatch({ type: 'BULK_IMPORT_LEADS', payload: leads })
    setImportResult({ imported: valid.length, skipped: preview.length - valid.length, total: preview.length })
    setStep('done')
  }

  return (
    <Modal size="lg" onClose={onClose} title="Bulk Import Leads">
      <div className="modal-body">
        {step === 'upload' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>⬇ Download Template</button>
            </div>
            <div
              style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Drop CSV/Excel file here or click to browse</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supports CSV format. Download template above for proper column format.</div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {step === 'map' && csvData && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              Map your CSV columns to CRM fields. {csvData.rows.length} rows detected.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {csvData.headers.map(h => (
                <div key={h} className="form-group">
                  <label>{h}</label>
                  <select value={mapping[h] || ''} onChange={e => setMapping(p => ({ ...p, [h]: e.target.value }))}>
                    <option value="">— Skip column —</option>
                    {Object.entries(FIELD_MAP).map(([label, field]) => (
                      <option key={field} value={field}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4 }}>{preview.filter(r => !r._errors.length).length} valid</span>
              <span style={{ fontSize: 12, background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4 }}>{preview.filter(r => r._errors.length).length} with errors (will be skipped)</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Row</th><th>Contact</th><th>Company</th><th>Email</th><th>Status</th></tr></thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{row._row}</td>
                      <td>{row.contactPerson || '—'}</td>
                      <td>{row.companyName || '—'}</td>
                      <td>{row.email || '—'}</td>
                      <td>
                        {row._errors.length
                          ? <span style={{ fontSize: 11, color: 'var(--red)' }}>⚠ {row._errors.join(', ')}</span>
                          : <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'done' && importResult && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Import Complete</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
              <div className="card" style={{ textAlign: 'center', padding: '12px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{importResult.imported}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Imported</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '12px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>{importResult.skipped}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skipped</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '12px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{importResult.total}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        {step === 'upload' && <button className="btn btn-secondary" onClick={onClose}>Cancel</button>}
        {step === 'map' && (
          <>
            <button className="btn btn-secondary" onClick={() => setStep('upload')}>Back</button>
            <button className="btn btn-primary" onClick={buildPreview}>Preview Import →</button>
          </>
        )}
        {step === 'preview' && (
          <>
            <button className="btn btn-secondary" onClick={() => setStep('map')}>Back</button>
            <button className="btn btn-primary" onClick={doImport} disabled={!preview.filter(r => !r._errors.length).length}>
              Import {preview.filter(r => !r._errors.length).length} Leads
            </button>
          </>
        )}
        {step === 'done' && <button className="btn btn-primary" onClick={onClose}>Done</button>}
      </div>
    </Modal>
  )
}
