'use client'

import { useRef, useEffect, useState } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react'

interface VideoPlayerProps {
  videoId: number
  title: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

interface DRMConfig {
  widevine?: {
    license_url: string
    headers: Record<string, string>
  }
  fairplay?: {
    license_url: string
    certificate_url: string
    headers: Record<string, string>
  }
  watermark?: {
    enabled: boolean
    text: string
    position: 'random' | 'fixed'
    opacity: number
    interval: number
  }
}

export default function VideoPlayer({ videoId, title, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quality, setQuality] = useState('auto')
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto'])
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drmConfig, setDrmConfig] = useState<DRMConfig | null>(null)
  const [bufferingCount, setBufferingCount] = useState(0)

  // Fetch streaming URL and DRM config
  useEffect(() => {
    fetchStreamingData()
  }, [videoId])

  const fetchStreamingData = async () => {
    try {
      setIsLoading(true)
      
      // Get DRM token
      const drmResponse = await fetch(`/api/v1/videos/${videoId}/drm-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: 'web' }),
      })

      if (!drmResponse.ok) {
        throw new Error('DRM token alınamadı')
      }

      const drmData = await drmResponse.json()
      setDrmConfig(drmData.drm_config)

      // Get streaming URL
      const streamResponse = await fetch(`/api/v1/videos/${videoId}/streaming-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!streamResponse.ok) {
        throw new Error('Video yüklenemedi')
      }

      const streamData = await streamResponse.json()
      
      // Initialize HLS player
      initializePlayer(streamData.streaming.streaming_url, drmData.drm_config)
      
      // Track playback
      trackPlayback()
      
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video yüklenirken hata oluştu')
      setIsLoading(false)
    }
  }

  const initializePlayer = (streamUrl: string, drm: DRMConfig) => {
    if (!videoRef.current) return

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hlsRef.current = hls

      // Configure DRM
      if (drm.widevine) {
        hls.config.widevineLicenseUrl = drm.widevine.license_url
        hls.config.licenseXhrSetup = (xhr) => {
          Object.entries(drm.widevine!.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value)
          })
        }
      }

      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)

      // Track buffering
      hls.on(Hls.Events.BUFFER_FLUSHING, () => {
        setBufferingCount((prev) => prev + 1)
      })

      // Get available qualities
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level, index) => {
          return `${level.height}p`
        })
        setAvailableQualities(['auto', ...qualities])
      })

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Video oynatılırken kritik hata oluştu')
        }
      })

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = streamUrl
    }

    // Setup watermark
    if (drm.watermark?.enabled) {
      setupWatermark(drm.watermark)
    }
  }

  const setupWatermark = (watermarkConfig: DRMConfig['watermark']) => {
    if (!watermarkConfig || !watermarkRef.current || !containerRef.current) return

    const container = containerRef.current
    const watermark = watermarkRef.current

    const updateWatermarkPosition = () => {
      if (watermarkConfig.position === 'random') {
        const maxX = container.clientWidth - watermark.clientWidth - 20
        const maxY = container.clientHeight - watermark.clientHeight - 20
        const randomX = Math.random() * maxX
        const randomY = Math.random() * maxY

        watermark.style.left = `${randomX}px`
        watermark.style.top = `${randomY}px`
      }
    }

    // Initial position
    updateWatermarkPosition()

    // Update position at intervals
    watermarkInterval.current = setInterval(
      updateWatermarkPosition,
      watermarkConfig.interval * 1000
    )
  }

  const trackPlayback = async () => {
    try {
      await fetch(`/api/v1/videos/${videoId}/track-playback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: getDeviceId(),
          location: await getLocation(),
        }),
      })
    } catch (err) {
      console.error('Playback tracking failed:', err)
    }
  }

  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  const getLocation = async (): Promise<string | undefined> => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return `${data.city}, ${data.country_name}`
    } catch {
      return undefined
    }
  }

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Track progress
      if (duration > 0 && onProgress) {
        const progress = (video.currentTime / duration) * 100
        onProgress(progress)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      if (onComplete) {
        onComplete()
      }
      // Track completion
      trackVideoAnalytics(100)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [duration, onProgress, onComplete])

  // Cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
      if (watermarkInterval.current) {
        clearInterval(watermarkInterval.current)
      }
      // Track final analytics
      trackVideoAnalytics((currentTime / duration) * 100)
    }
  }, [])

  const trackVideoAnalytics = async (completionRate: number) => {
    try {
      await fetch(`/api/v1/videos/${videoId}/track-analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: Math.floor(currentTime),
          quality,
          buffering_count: bufferingCount,
          completion_rate: completionRate,
          device_type: 'web',
        }),
      })
    } catch (err) {
      console.error('Analytics tracking failed:', err)
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = value
    setVolume(value)
    setIsMuted(value === 0)
  }

  const handleSeek = (value: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = value
    setCurrentTime(value)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const changeQuality = (newQuality: string) => {
    if (!hlsRef.current) return

    setQuality(newQuality)

    if (newQuality === 'auto') {
      hlsRef.current.currentLevel = -1
    } else {
      const qualityIndex = availableQualities.indexOf(newQuality) - 1
      if (qualityIndex >= 0) {
        hlsRef.current.currentLevel = qualityIndex
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchStreamingData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
      />

      {/* Watermark */}
      {drmConfig?.watermark?.enabled && (
        <div
          ref={watermarkRef}
          className="absolute pointer-events-none select-none"
          style={{
            opacity: drmConfig.watermark.opacity,
            color: '#FFFFFF',
            fontSize: `${drmConfig.watermark.font_size || 24}px`,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          {drmConfig.watermark.text}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-4"
        />

        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isMuted ? 'Sesi Aç' : 'Sessiz'}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Quality Selector */}
            <div className="relative group/quality">
              <button className="text-white hover:text-blue-400 transition-colors">
                <Settings size={24} />
              </button>
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden opacity-0 group-hover/quality:opacity-100 transition-opacity">
                {availableQualities.map((q) => (
                  <button
                    key={q}
                    onClick={() => changeQuality(q)}
                    className={`block w-full px-4 py-2 text-left text-white hover:bg-gray-700 ${
                      quality === q ? 'bg-blue-600' : ''
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Tam Ekran"
            >
              <Maximize size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
