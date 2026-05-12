import { useState, useRef, useEffect } from 'react'

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/draywntzu/image/upload'
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxJ6Ce9mV8gUZW96Tv2BdXrHfC_NnWLnLMdwR7E2b3auCNBQ4fdIl2Sep6TM6enPX8OFA/exec'

const requiredFields = [
  'name',
  'roll',
  'email',
  'phone',
  'series',
  'school',
  'college',
  'hometown',
  'facebook_profile',
]

const initialFormState = {
  name: '',
  roll: '',
  email: '',
  phone: '',
  series: '',
  school: '',
  college: '',
  hometown: '',
  facebook_profile: '',
  skills: '',
  image_url: '',
}

function validateEmail(email) {
  if (!email) return { valid: false, message: '' }
  const hasAt = email.includes('@')
  const hasDomain = /\.com$|\.net$|\.edu$|\.org$|\.gov$|\.io$/i.test(email)
  if (!hasAt) return { valid: false, message: 'Email must contain @' }
  if (!hasDomain) return { valid: false, message: 'Must have valid domain (.com, .net, etc.)' }
  return { valid: true, message: '' }
}

function validatePhone(phone) {
  if (!phone) return { valid: false, message: '' }
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 11) {
    return { valid: false, message: `At least 11 digits (${digitsOnly.length}/11)` }
  }
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [consent, setConsent] = useState(false)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value)
      case 'phone':
        return validatePhone(value)
      default:
        return { valid: value.trim().length > 0, message: value.trim() ? '' : 'This field is required' }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const result = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: result.valid ? '' : result.message }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const result = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: result.valid ? '' : result.message }))
  }

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      const newSkill = skillInput.trim()
      if (!skills.includes(newSkill)) {
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
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select an image file' }))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 10MB' }))
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setErrors((prev) => ({ ...prev, image: '' }))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadToCloudinary = async (file) => {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('upload_preset', 'alumni')

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formDataUpload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.secure_url
  }

  const isFormValid = () => {
    const emailValid = validateEmail(formData.email).valid
    const phoneValid = validatePhone(formData.phone).valid
    const allRequiredFilled = requiredFields.every((field) => formData[field].trim().length > 0)
    return emailValid && phoneValid && allRequiredFilled && consent
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const newErrors = {}
    requiredFields.forEach((field) => {
      const result = validateField(field, formData[field])
      if (!result.valid) {
        newErrors[field] = result.message
      }
    })

    if (!validateEmail(formData.email).valid) {
      newErrors.email = validateEmail(formData.email).message
    }
    if (!validatePhone(formData.phone).valid) {
      newErrors.phone = validatePhone(formData.phone).message
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}))
      return
    }

    if (!consent) {
      setSubmitError('Please accept the consent checkbox to proceed')
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = ''

      if (imageFile) {
        setUploading(true)
        console.log('Uploading image to Cloudinary...')
        try {
          imageUrl = await uploadToCloudinary(imageFile)
          console.log('Image uploaded successfully:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          imageUrl = ''
        }
        setUploading(false)
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: new URLSearchParams({
          name: formData.name,
          roll: formData.roll,
          email: formData.email,
          phone: formData.phone,
          series: formData.series,
          school: formData.school,
          college: formData.college,
          hometown: formData.hometown,
          facebook_profile: formData.facebook_profile,
          skills: formData.skills,
          image_url: imageUrl,
        }),
      })

      // Log what was sent
      console.log('=== DATA SENT TO SERVER ===')
      console.log('name:', formData.name)
      console.log('roll:', formData.roll)
      console.log('email:', formData.email)
      console.log('phone:', formData.phone)
      console.log('series:', formData.series)
      console.log('school:', formData.school)
      console.log('college:', formData.college)
      console.log('hometown:', formData.hometown)
      console.log('facebook_profile:', formData.facebook_profile)
      console.log('skills:', formData.skills)
      console.log('image_url:', imageUrl)
      console.log('==========================')

      const result = await response.text()
      console.log('Response:', result)

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFormData(initialFormState)
    setErrors({})
    setTouched({})
    setConsent(false)
    setSkills([])
    setSkillInput('')
    setImageFile(null)
    setImagePreview(null)
    setSubmitted(false)
    setSubmitError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
            <button onClick={handleReset} className="reset-btn">
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-icon">📚</div>
          <h1>Student Registration</h1>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          {theme === 'light' ? 'Dark' : 'Light'}
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
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${touched.name && errors.name ? 'error' : ''} ${touched.name && !errors.name && formData.name ? 'valid' : ''}`}
            placeholder="Enter your full name"
          />
          {touched.name && errors.name && (
            <div className="form-error"><AlertIcon />{errors.name}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Roll Number <span className="required">*</span></label>
            <input
              type="text"
              name="roll"
              value={formData.roll}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.roll && errors.roll ? 'error' : ''} ${touched.roll && !errors.roll && formData.roll ? 'valid' : ''}`}
              placeholder="e.g., 12345"
            />
            {touched.roll && errors.roll && (
              <div className="form-error"><AlertIcon />{errors.roll}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Series <span className="required">*</span></label>
            <input
              type="text"
              name="series"
              value={formData.series}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.series && errors.series ? 'error' : ''} ${touched.series && !errors.series && formData.series ? 'valid' : ''}`}
              placeholder="e.g., 2024"
            />
            {touched.series && errors.series && (
              <div className="form-error"><AlertIcon />{errors.series}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.email && errors.email ? 'error' : ''} ${touched.email && !errors.email && formData.email ? 'valid' : ''}`}
              placeholder="you@example.com"
            />
            {touched.email && errors.email && (
              <div className="form-error"><AlertIcon />{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.phone && errors.phone ? 'error' : ''} ${touched.phone && !errors.phone && formData.phone ? 'valid' : ''}`}
              placeholder="+880 1XXX XXXXXX"
            />
            {touched.phone && errors.phone && (
              <div className="form-error"><AlertIcon />{errors.phone}</div>
            )}
          </div>
        </div>

        <div className="section-divider" />
        <div className="section-title">Educational Details</div>

        <div className="form-group">
          <label className="form-label">School <span className="required">*</span></label>
          <input
            type="text"
            name="school"
            value={formData.school}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${touched.school && errors.school ? 'error' : ''} ${touched.school && !errors.school && formData.school ? 'valid' : ''}`}
            placeholder="Enter your school name"
          />
          {touched.school && errors.school && (
            <div className="form-error"><AlertIcon />{errors.school}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">College <span className="required">*</span></label>
          <input
            type="text"
            name="college"
            value={formData.college}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${touched.college && errors.college ? 'error' : ''} ${touched.college && !errors.college && formData.college ? 'valid' : ''}`}
            placeholder="Enter your college name"
          />
          {touched.college && errors.college && (
            <div className="form-error"><AlertIcon />{errors.college}</div>
          )}
        </div>

        <div className="section-divider" />
        <div className="section-title">Additional Information</div>

        <div className="form-group">
          <label className="form-label">Home Town <span className="required">*</span></label>
          <input
            type="text"
            name="hometown"
            value={formData.hometown}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${touched.hometown && errors.hometown ? 'error' : ''} ${touched.hometown && !errors.hometown && formData.hometown ? 'valid' : ''}`}
            placeholder="Enter your hometown"
          />
          {touched.hometown && errors.hometown && (
            <div className="form-error"><AlertIcon />{errors.hometown}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Facebook URL <span className="required">*</span></label>
          <input
            type="url"
            name="facebook_profile"
            value={formData.facebook_profile}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${touched.facebook_profile && errors.facebook_profile ? 'error' : ''} ${touched.facebook_profile && !errors.facebook_profile && formData.facebook_profile ? 'valid' : ''}`}
            placeholder="https://facebook.com/..."
          />
          {touched.facebook_profile && errors.facebook_profile && (
            <div className="form-error"><AlertIcon />{errors.facebook_profile}</div>
          )}
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
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder={skills.length === 0 ? 'Type and press Enter' : ''}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Profile Image (Optional)</label>
          <div
            className={`image-upload ${imagePreview ? 'has-image' : ''}`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="preview-image" />
            ) : (
              <div className="image-upload-content">
                <span className="image-upload-icon"><UploadIcon /></span>
                <span className="image-upload-text">Tap to upload image</span>
                <span className="image-upload-hint">PNG, JPG up to 10MB</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
          {imageFile && !imagePreview && (
            <div className="upload-actions">
              <button type="button" onClick={handleRemoveImage} className="remove-btn">Remove</button>
            </div>
          )}
          {imagePreview && (
            <div className="upload-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="upload-btn">Change Image</button>
              <button type="button" onClick={handleRemoveImage} className="remove-btn">Remove</button>
            </div>
          )}
          {uploading && <p className="form-helper">Uploading to Cloudinary...</p>}
          {errors.image && (
            <div className="form-error"><AlertIcon />{errors.image}</div>
          )}
        </div>

        <div className="section-divider" />

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="consent" className="checkbox-label">
              I consent to the collection and storage of my personal information. <span className="required">*</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`submit-btn ${submitting ? 'loading' : ''}`}
            disabled={!isFormValid() || submitting || uploading}
          >
            {uploading ? 'Uploading...' : submitting ? '' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  )
}