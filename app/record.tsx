import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalysis } from '../context/AnalysisContext';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

export default function RecordScreen() {
  const { setVideo, setViewAngle, state } = useAnalysis();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermissions = async () => {
    const cam = await requestCameraPermission();
    const mic = await requestMicPermission();
    return cam.granted && mic.granted;
  };

  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
      );

      const recording = await cameraRef.current.recordAsync({
        maxDuration: 15,
      });

      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      if (recording?.uri) {
        setVideo(recording.uri);
        router.push('/analysis');
      }
    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Could not record video. Please try again.');
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo(result.assets[0].uri);
      router.push('/analysis');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionCard}>
          <Ionicons name="videocam-outline" size={48} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            SwingIQ needs camera and microphone access to record your golf swing
            for AI analysis.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionBtnText}>Grant Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.uploadInsteadBtn}
            onPress={pickFromGallery}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={COLORS.textSecondary}
            />
            <Text style={styles.uploadInsteadText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isRecording ? (
            <View style={styles.recordingBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recTime}>{formatTime(recordingTime)}</Text>
            </View>
          ) : (
            <Text style={styles.headerTitle}>Record Swing</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() =>
            setFacing((f) => (f === 'back' ? 'front' : 'back'))
          }
          disabled={isRecording}
        >
          <Ionicons
            name="camera-reverse-outline"
            size={24}
            color={isRecording ? 'rgba(255,255,255,0.3)' : 'white'}
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* View angle selector */}
      {!isRecording && (
        <View style={styles.angleSelector}>
          {(['face-on', 'down-the-line'] as const).map((angle) => (
            <TouchableOpacity
              key={angle}
              style={[
                styles.angleBtn,
                state.viewAngle === angle && styles.angleBtnActive,
              ]}
              onPress={() => setViewAngle(angle)}
            >
              <Text
                style={[
                  styles.angleBtnText,
                  state.viewAngle === angle && styles.angleBtnTextActive,
                ]}
              >
                {angle === 'face-on' ? 'Face-On' : 'Down-the-Line'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Swing frame guide */}
      {!isRecording && (
        <View style={styles.frameGuide}>
          <View style={styles.frameCornerTL} />
          <View style={styles.frameCornerTR} />
          <View style={styles.frameCornerBL} />
          <View style={styles.frameCornerBR} />
          <Text style={styles.frameGuideText}>
            Keep full body in frame
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <LinearGradient
        colors={['transparent', 'rgba(10,14,26,0.95)']}
        style={styles.bottomOverlay}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.controls}>
            {/* Upload button */}
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={pickFromGallery}
              disabled={isRecording}
            >
              <Ionicons
                name="images-outline"
                size={26}
                color={isRecording ? 'rgba(255,255,255,0.3)' : 'white'}
              />
              <Text
                style={[
                  styles.sideBtnText,
                  isRecording && { opacity: 0.3 },
                ]}
              >
                Gallery
              </Text>
            </TouchableOpacity>

            {/* Record button */}
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!cameraReady}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View style={styles.recordIcon} />
              )}
            </TouchableOpacity>

            {/* Tips button */}
            <TouchableOpacity
              style={styles.sideBtn}
              disabled={isRecording}
              onPress={() =>
                Alert.alert(
                  'Recording Tips',
                  '• Record face-on or down-the-line\n• Full body in frame\n• Good lighting\n• 2-5 second swing\n• Keep camera stable',
                  [{ text: 'Got it', style: 'default' }]
                )
              }
            >
              <Ionicons
                name="help-circle-outline"
                size={26}
                color={isRecording ? 'rgba(255,255,255,0.3)' : 'white'}
              />
              <Text
                style={[
                  styles.sideBtnText,
                  isRecording && { opacity: 0.3 },
                ]}
              >
                Tips
              </Text>
            </TouchableOpacity>
          </View>

          {!isRecording && (
            <Text style={styles.hint}>
              Tap record to capture your swing (max 15s)
            </Text>
          )}
          {isRecording && (
            <Text style={styles.hint}>Tap stop when swing is complete</Text>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const FRAME_SIZE = width * 0.7;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  permissionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  permissionDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadInsteadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  uploadInsteadText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,68,68,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  recTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  angleSelector: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    padding: 4,
  },
  angleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  angleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  angleBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  angleBtnTextActive: {
    color: 'white',
  },

  frameGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: FRAME_SIZE,
    height: FRAME_SIZE * 1.4,
    marginLeft: -FRAME_SIZE / 2,
    marginTop: -(FRAME_SIZE * 1.4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderTopLeftRadius: 4,
  },
  frameCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderTopRightRadius: 4,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomLeftRadius: 4,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomRightRadius: 4,
  },
  frameGuideText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    position: 'absolute',
    bottom: -24,
  },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  sideBtn: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  sideBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255,68,68,0.3)',
    borderColor: COLORS.error,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error,
  },
  stopIcon: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
});
