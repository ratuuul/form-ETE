import { useState, useRef, useEffect } from 'react'

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/draywntzu/image/upload'
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxJ6Ce9mV8gUZW96Tv2BdXrHfC_NnWLnLMdwR7E2b3auCNBQ4fdIl2Sep6TM6enPX8OFA/exec'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_TEXT_LENGTH = 500

const requiredFields = [
  'name', 'roll', 'email', 'phone', 'series',
  'school', 'college', 'hometown', 'facebook_profile'
]

const initialFormState = {
  name: '', roll: '', email: '', phone: '', series: '',
  school: '', college: '', hometown: '', facebook_profile: '',
  skills: '', image_url: ''
}

function sanitizeForSubmission(input) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}

function detectXSS(input) {
  if (typeof input !== 'string') return null
  const patterns = [
    { regex: /<script/i, name: 'script tag' },
    { regex: /<iframe/i, name: 'iframe tag' },
    { regex: /<object/i, name: 'object tag' },
    { regex: /<embed/i, name: 'embed tag' },
    { regex: /<link/i, name: 'link tag' },
    { regex: /<style/i, name: 'style tag' },
    { regex: /javascript:/i, name: 'javascript protocol' },
    { regex: /on\w+\s*=/i, name: 'event handler' },
    { regex: /<[^>]*>/g, name: 'HTML tags' },
    { regex: /&lt;|&#/i, name: 'encoded characters' }
  ]
  for (const p of patterns) {
    if (p.regex.test(input)) return `Dangerous pattern: ${p.name}`
  }
  return null
}

function sanitizeUrl(url) {
  if (!url) return ''
  try {
    const sanitized = sanitizeForSubmission(url)
    const parsed = new URL(sanitized)
    if (['http:', 'https:'].includes(parsed.protocol)) return sanitized
    return ''
  } catch { return '' }
}

function validateEmail(email) {
  if (!email) return { valid: false, message: '' }
  const sanitized = sanitizeForSubmission(email)
  const hasAt = sanitized.includes('@')
  const hasDomain = /\.com$|\.net$|\.edu$|\.org$|\.gov$|\.io$/i.test(sanitized)
  if (!hasAt) return { valid: false, message: 'Email must contain @' }
  if (!hasDomain) return { valid: false, message: 'Must have valid domain (.com, .net, etc.)' }
  return { valid: true, message: '' }
}

function validatePhone(phone) {
  if (!phone) return { valid: false, message: '' }
  const sanitized = sanitizeForSubmission(phone)
  const digitsOnly = sanitized.replace(/\D/g, '')
  if (digitsOnly.length < 11) return { valid: false, message: `At least 11 digits (${digitsOnly.length}/11)` }
  if (digitsOnly.length > 20) return { valid: false, message: 'Phone too long (max 20 digits)' }
  return { valid: true, message: '' }
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [consent, setConsent] = useState(false)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showLoading, setShowLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const fileInputRef = useRef(null)

  const loadingMessages = [
    'Please wait while <span>encrypting data</span>...',
    'Please wait while <span>establishing connection</span>...',
    'Please wait while <span>transferring files</span>...',
    'Please wait while <span>verifying credentials</span>...',
    'Please wait while <span>securing channel</span>...'
  ]

  useEffect(() => {
    if (showLoading) {
      let index = 0
      setLoadingMessage(loadingMessages[0])
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length
        setLoadingMessage(loadingMessages[index])
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [showLoading])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const validateField = (name, value) => {
    switch (name) {
      case 'email': return validateEmail(value)
      case 'phone': return validatePhone(value)
      default: {
        const xssWarning = detectXSS(value)
        if (xssWarning) return { valid: false, message: xssWarning }
        const sanitized = sanitizeForSubmission(value)
        return { valid: sanitized.length > 0, message: sanitized.length > 0 ? '' : 'This field is required' }
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    const result = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: result.valid ? '' : result.message }))
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const result = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: result.valid ? '' : result.message }))
  }

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      const newSkill = sanitizeForSubmission(skillInput.trim())
      if (newSkill && newSkill.length <= 50 && !skills.includes(newSkill) && skills.length < 20) {
        setSkills([...skills, newSkill])
        setFormData((prev) => ({ ...prev, skills: [...skills, newSkill].join(', ') }))
      }
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = skills.filter((s) => s !== skillToRemove)
    setSkills(newSkills)
    setFormData((prev) => ({ ...prev, skills: newSkills.join(', ') }))
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, image: 'Only JPEG, PNG, GIF, or WebP allowed' }))
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }))
        return
      }
      if (/[<>'"&]/.test(file.name)) {
        setErrors((prev) => ({ ...prev, image: 'Invalid file name' }))
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setErrors((prev) => ({ ...prev, image: '' }))
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadToCloudinary = async (file) => {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('upload_preset', 'alumni')
    const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formDataUpload })
    if (!response.ok) throw new Error('Upload failed')
    const data = await response.json()
    if (data.secure_url && data.secure_url.startsWith('https://res.cloudinary.com')) {
      return data.secure_url
    }
    throw new Error('Invalid response')
  }

  const isFormValid = () => {
    const emailValid = validateEmail(formData.email).valid
    const phoneValid = validatePhone(formData.phone).valid
    const allFilled = requiredFields.every((field) => {
      const val = sanitizeForSubmission(formData[field])
      return val.length > 0
    })
    return emailValid && phoneValid && allFilled && consent
  }

  const hasValue = (field) => formData[field] && formData[field].trim().length > 0
  const hasNoErrors = (field) => !errors[field]
  const hasXssWarning = (field) => errors[field] && errors[field].includes('Dangerous')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const newErrors = {}
    requiredFields.forEach((field) => {
      const result = validateField(field, formData[field])
      if (!result.valid) newErrors[field] = result.message
    })

    if (!validateEmail(formData.email).valid) newErrors.email = validateEmail(formData.email).message
    if (!validatePhone(formData.phone).valid) newErrors.phone = validatePhone(formData.phone).message

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!consent) {
      setSubmitError('Please accept the consent checkbox to proceed')
      return
    }

    setSubmitting(true)
    setShowLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      let imageUrl = formData.image_url
      if (imageFile && !imageUrl) imageUrl = await uploadToCloudinary(imageFile)

      const sanitizedData = {
        name: sanitizeForSubmission(formData.name),
        roll: sanitizeForSubmission(formData.roll),
        email: sanitizeForSubmission(formData.email).toLowerCase(),
        phone: sanitizeForSubmission(formData.phone),
        series: sanitizeForSubmission(formData.series),
        school: sanitizeForSubmission(formData.school),
        college: sanitizeForSubmission(formData.college),
        hometown: sanitizeForSubmission(formData.hometown),
        facebook_profile: sanitizeUrl(formData.facebook_profile),
        skills: sanitizeForSubmission(formData.skills),
        image_url: sanitizeUrl(imageUrl)
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: new URLSearchParams(sanitizedData)
      })

      const result = await response.text()
      if (!response.ok) throw new Error('Submission failed')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowLoading(false)
      setSubmitted(true)
    } catch (error) {
      setShowLoading(false)
      setSubmitError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleReset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setFormData(initialFormState)
    setErrors({})
    setConsent(false)
    setSkills([])
    setSkillInput('')
    setImageFile(null)
    setImagePreview(null)
    setSubmitted(false)
    setSubmitError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (submitted) {
    return (
      <div className="app-container">
        <div className="form-card">
          <div className="success-message">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2>Registration Complete!</h2>
            <p>Your information has been submitted successfully.</p>
            <button onClick={handleReset} className="reset-btn">Submit Another Response</button>
          </div>
        </div>
      </div>
    )
  }

  if (showLoading) {
    return (
      <div className="loading-overlay">
        <div className="telecom-towers">
          <div className="tower tower-left">
            <div className="tower-body"></div>
            <div className="tower-top"></div>
            <div className="signal signal-1"></div>
            <div className="signal signal-2"></div>
            <div className="signal signal-3"></div>
          </div>
          <div className="data-packet packet-right"></div>
          <div className="data-packet packet-left"></div>
          <div className="tower tower-right">
            <div className="tower-body"></div>
            <div className="tower-top"></div>
            <div className="signal signal-1"></div>
            <div className="signal signal-2"></div>
            <div className="signal signal-3"></div>
          </div>
        </div>
        <div className="loading-text" dangerouslySetInnerHTML={{ __html: loadingMessage }}></div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-icon">📚</div>
          <h1>Data Collection ETE</h1>
        </div>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        {submitError && (
          <div className="error-banner">
            <AlertIcon />
            {submitError}
          </div>
        )}

        <div className="section-title">Personal Information</div>

        <div className="form-group">
          <label className="form-label">Name <span className="required">*</span></label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur}
            className={`form-input ${hasXssWarning('name') ? 'xss-warning' : ''} ${hasNoErrors('name') && hasValue('name') ? 'valid' : ''}`}
            placeholder="Enter your full name" maxLength={MAX_TEXT_LENGTH} />
          {errors.name && <div className="form-error"><AlertIcon />{errors.name}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Roll Number <span className="required">*</span></label>
            <input type="text" name="roll" value={formData.roll} onChange={handleChange} onBlur={handleBlur}
              className={`form-input ${hasXssWarning('roll') ? 'xss-warning' : ''} ${hasNoErrors('roll') && hasValue('roll') ? 'valid' : ''}`}
              placeholder="e.g., 12345" maxLength={50} />
            {errors.roll && <div className="form-error"><AlertIcon />{errors.roll}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Series <span className="required">*</span></label>
            <input type="text" name="series" value={formData.series} onChange={handleChange} onBlur={handleBlur}
              className={`form-input ${hasXssWarning('series') ? 'xss-warning' : ''} ${hasNoErrors('series') && hasValue('series') ? 'valid' : ''}`}
              placeholder="e.g., 2024" maxLength={20} />
            {errors.series && <div className="form-error"><AlertIcon />{errors.series}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur}
              className={`form-input ${errors.email ? 'xss-warning' : ''} ${hasNoErrors('email') && hasValue('email') ? 'valid' : ''}`}
              placeholder="you@example.com" maxLength={100} />
            {errors.email && <div className="form-error"><AlertIcon />{errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur}
              className={`form-input ${errors.phone ? 'xss-warning' : ''} ${hasNoErrors('phone') && hasValue('phone') ? 'valid' : ''}`}
              placeholder="+880 1XXX XXXXXX" maxLength={20} />
            {errors.phone && <div className="form-error"><AlertIcon />{errors.phone}</div>}
          </div>
        </div>

        <div className="section-divider" />
        <div className="section-title">Educational Details</div>

        <div className="form-group">
          <label className="form-label">School <span className="required">*</span></label>
          <input type="text" name="school" value={formData.school} onChange={handleChange} onBlur={handleBlur}
            className={`form-input ${hasXssWarning('school') ? 'xss-warning' : ''} ${hasNoErrors('school') && hasValue('school') ? 'valid' : ''}`}
            placeholder="Enter your school name" maxLength={MAX_TEXT_LENGTH} />
          {errors.school && <div className="form-error"><AlertIcon />{errors.school}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">College <span className="required">*</span></label>
          <input type="text" name="college" value={formData.college} onChange={handleChange} onBlur={handleBlur}
            className={`form-input ${hasXssWarning('college') ? 'xss-warning' : ''} ${hasNoErrors('college') && hasValue('college') ? 'valid' : ''}`}
            placeholder="Enter your college name" maxLength={MAX_TEXT_LENGTH} />
          {errors.college && <div className="form-error"><AlertIcon />{errors.college}</div>}
        </div>

        <div className="section-divider" />
        <div className="section-title">Additional Information</div>

        <div className="form-group">
          <label className="form-label">Home Town <span className="required">*</span></label>
          <input type="text" name="hometown" value={formData.hometown} onChange={handleChange} onBlur={handleBlur}
            className={`form-input ${hasXssWarning('hometown') ? 'xss-warning' : ''} ${hasNoErrors('hometown') && hasValue('hometown') ? 'valid' : ''}`}
            placeholder="Enter your hometown" maxLength={MAX_TEXT_LENGTH} />
          {errors.hometown && <div className="form-error"><AlertIcon />{errors.hometown}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Facebook URL <span className="required">*</span></label>
          <input type="url" name="facebook_profile" value={formData.facebook_profile} onChange={handleChange} onBlur={handleBlur}
            className={`form-input ${hasXssWarning('facebook_profile') ? 'xss-warning' : ''} ${hasNoErrors('facebook_profile') && hasValue('facebook_profile') ? 'valid' : ''}`}
            placeholder="https://facebook.com/..." maxLength={500} />
          {errors.facebook_profile && <div className="form-error"><AlertIcon />{errors.facebook_profile}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Skills (Optional)</label>
          <div className="skills-input">
            {skills.map((skill) => (
              <span key={skill} className="skill-tag">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
              </span>
            ))}
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleAddSkill}
              placeholder={skills.length === 0 ? 'Type and press Enter' : ''} maxLength={50} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Profile Image (Optional)</label>
          <div className={`image-upload ${imagePreview ? 'has-image' : ''}`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="preview-image" />
            ) : (
              <div className="image-upload-content">
                <span className="image-upload-icon"><UploadIcon /></span>
                <span className="image-upload-text">Tap to upload image</span>
                <span className="image-upload-hint">PNG, JPG up to 5MB</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />
          {imagePreview && (
            <div className="upload-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="upload-btn">Change Image</button>
              <button type="button" onClick={handleRemoveImage} className="remove-btn">Remove</button>
            </div>
          )}
          {errors.image && <div className="form-error"><AlertIcon />{errors.image}</div>}
        </div>

        <div className="section-divider" />

        <div className="form-group">
          <div className="checkbox-group">
            <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="checkbox-input" />
            <label htmlFor="consent" className="checkbox-label">
              I consent to the collection and storage of my personal information. <span className="required">*</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className={`submit-btn ${submitting ? 'loading' : ''}`}
            disabled={!isFormValid() || submitting || uploading}>
            {submitting ? '' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  )
}