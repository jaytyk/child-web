import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  ChildProfile, 
  DailyUsage, 
  EncouragingMessage, 
  GameStatRecord, 
  LearningMaterial, 
  MathRecord, 
  ReviewRecord,
  ColoringTemplate 
} from '../types';
import { 
  getRecentUsage, 
  getAllGameStats, 
  getReviewRecords, 
  getAllReviewRecords,
  getAllAssets, 
  getAllTemplates, 
  saveCustomAsset, 
  deleteCustomAsset, 
  deleteAssetsByCategory,
  saveCustomAssetsBatch,
  saveCustomTemplate, 
  deleteCustomTemplate,
  getEncouragingMessages,
  saveEncouragingMessage,
  exportAllData,
  importAllData,
  resetAllData,
  saveProfile,
  getAllProfiles,
} from '../utils/db';
import { speak, playSfx, updateAudioSettings } from '../utils/audio';
import { 
  DEFAULT_CATEGORIES, 
  RECOMMENDED_PRESETS, 
  PresetBundle, 
  getCategoryIcon, 
  suggestEmojiForName 
} from '../utils/materials';
import { 
  BarChart3, 
  Settings as SettingsIcon, 
  MessageSquareHeart, 
  Upload, 
  Trash2, 
  Download, 
  RotateCcw, 
  User, 
  Volume2, 
  Clock, 
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  Search,
  FolderPlus,
  Sparkles,
  Tag,
  Package,
  Check,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ParentDashboardProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onMaterialsUpdated?: (materials: LearningMaterial[]) => void;
  onTemplatesUpdated?: (templates: ColoringTemplate[]) => void;
}

const ENCOURAGING_TEMPLATES = [
  '오늘도 재미있게 놀자, 사랑해!',
  '토끼랑 즐겁게 놀면 생각이 쑥쑥 자라나요!',
  '실패해도 괜찮아, 다시 해보면 돼!',
  '우리 아기 웃는 얼굴이 세상에서 제일 예뻐!',
  '스스로 해보는 모습이 정말 자랑스러워!',
  '차근차근 하나씩 재미있게 놀아보자!',
  '눈을 깜빡깜빡 쉬어가면서 놀아요!',
  '오늘 하루도 신나고 행복하게 보내자!'
];

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onMaterialsUpdated,
  onTemplatesUpdated,
}) => {
  const [tab, setTab] = useState<'stats' | 'settings' | 'messages' | 'materials' | 'data'>('stats');

  // Stats data
  const [usageList, setUsageList] = useState<DailyUsage[]>([]);
  const [gameStats, setGameStats] = useState<GameStatRecord[]>([]);
  const [mistakesList, setMistakesList] = useState<MathRecord[]>([]);
  const [allReviewItems, setAllReviewItems] = useState<ReviewRecord[]>([]);

  // Encouraging messages
  const [messages, setMessages] = useState<EncouragingMessage[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [msgAuthor, setMsgAuthor] = useState('엄마');
  const [msgTiming, setMsgTiming] = useState<'immediate' | 'next_login' | 'every_morning'>('immediate');

  // Materials & Templates
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);

  // Tab 4 sub-tab: 'words' | 'templates'
  const [materialsSubTab, setMaterialsSubTab] = useState<'words' | 'templates'>('words');

  // Custom Coloring Template upload states
  const [uploadTplTitle, setUploadTplTitle] = useState('');
  const [uploadTplCategory, setUploadTplCategory] = useState('캐릭터');
  const [uploadTplThreshold, setUploadTplThreshold] = useState(150);
  const [uploadTplInvert, setUploadTplInvert] = useState(false);
  const [uploadTplRawSrc, setUploadTplRawSrc] = useState<string | null>(null);
  const [uploadTplOutlineUrl, setUploadTplOutlineUrl] = useState<string | null>(null);
  const [uploadTplRawImg, setUploadTplRawImg] = useState<HTMLImageElement | null>(null);
  const [showTplUploadForm, setShowTplUploadForm] = useState(false);
  const tplFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Category & Material management states
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('toddler_custom_categories');
      return saved ? JSON.parse(saved) : ['뽀로로', '아기상어', '공룡'];
    } catch {
      return ['뽀로로', '아기상어', '공룡'];
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Upload custom asset states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState<string>('뽀로로');
  const [isDirectCategoryInput, setIsDirectCategoryInput] = useState(false);
  const [directCategoryName, setDirectCategoryName] = useState('');
  const [newAssetEmoji, setNewAssetEmoji] = useState('🐧');

  // Profiles
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    const usages = await getRecentUsage(14);
    setUsageList(usages);

    const stats = await getAllGameStats();
    setGameStats(stats);

    const mistakes = await getReviewRecords(settings.activeProfileId);
    setMistakesList(mistakes);

    const reviews = await getAllReviewRecords(settings.activeProfileId);
    setAllReviewItems(reviews);

    const msgs = await getEncouragingMessages();
    setMessages(msgs);

    const mats = await getAllAssets();
    setMaterials(mats);

    const tpls = await getAllTemplates();
    setTemplates(tpls);

    const profs = await getAllProfiles();
    setProfiles(profs);
  };

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);

    if (key === 'speechRate' || key === 'speechPitch' || key === 'speechVolume' || key === 'sfxVolume') {
      updateAudioSettings({
        rate: updated.speechRate,
        pitch: updated.speechPitch,
        volume: updated.speechVolume,
        sfxVolume: updated.sfxVolume,
      });
    }
  };

  const handleSaveMessage = async () => {
    if (!newMsgText.trim()) return;
    const msg: EncouragingMessage = {
      id: `msg_${Date.now()}`,
      text: newMsgText.trim(),
      author: msgAuthor,
      timing: msgTiming,
    };
    await saveEncouragingMessage(msg);
    setMessages(prev => [...prev, msg]);
    setNewMsgText('');
    speak(`${msgAuthor}가 말했어요: ${msg.text}`);
  };

  // Dynamic categories list
  const allCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...customCategories,
    ...materials.map(m => m.category)
  ])).filter(Boolean);

  const handleCreateCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('toddler_custom_categories', JSON.stringify(updated));
    }
    setNewAssetCategory(trimmed);
    setIsDirectCategoryInput(false);
    setDirectCategoryName('');
    setSelectedCategory(trimmed);
    setShowNewCategoryModal(false);
    setNewCategoryInput('');
    playSfx('correct');
    speak(`새 카테고리 ${trimmed}이(가) 추가되었습니다.`);
  };

  const handleDeleteCategory = async (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat) && !materials.some(m => m.category === cat && m.isCustom)) {
      speak('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`'${cat}' 카테고리와 이 카테고리의 맞춤 소재를 모두 삭제할까요?`)) return;
    await deleteAssetsByCategory(cat);
    const updatedCategories = customCategories.filter(c => c !== cat);
    setCustomCategories(updatedCategories);
    localStorage.setItem('toddler_custom_categories', JSON.stringify(updatedCategories));
    const mats = await getAllAssets();
    setMaterials(mats);
    onMaterialsUpdated?.(mats);
    if (selectedCategory === cat) setSelectedCategory('전체');
    if (newAssetCategory === cat) setNewAssetCategory('과일');
    playSfx('button');
    speak(`${cat} 카테고리가 삭제되었습니다.`);
  };

  const handleCreateAsset = async () => {
    const name = newAssetName.trim();
    if (!name) {
      speak('소재 이름을 입력해주세요.');
      return;
    }

    const category = isDirectCategoryInput ? directCategoryName.trim() : newAssetCategory;
    if (!category) {
      speak('카테고리 이름을 입력해주세요.');
      return;
    }

    if (isDirectCategoryInput && !customCategories.includes(category)) {
      const nextCats = [...customCategories, category];
      setCustomCategories(nextCats);
      localStorage.setItem('toddler_custom_categories', JSON.stringify(nextCats));
    }

    const emoji = newAssetEmoji.trim() || suggestEmojiForName(name, category);
    const newMat: LearningMaterial = {
      id: `custom_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      category,
      emoji,
      syllables: name.split(''),
      firstSound: name[0],
      isCustom: true,
      enabled: true,
    };
    await saveCustomAsset(newMat);
    const nextList = [...materials, newMat];
    setMaterials(nextList);
    onMaterialsUpdated?.(nextList);
    setNewAssetName('');
    setIsDirectCategoryInput(false);
    setDirectCategoryName('');
    setSelectedCategory(category);
    playSfx('success');
    speak(`${category} 카테고리에 ${name} 소재가 등록되었습니다!`);
  };

  const handleInstallPreset = async (preset: PresetBundle) => {
    const existingNames = new Set(materials.map(m => m.name));
    const toAdd: LearningMaterial[] = [];
    for (const item of preset.items) {
      if (!existingNames.has(item.name)) {
        toAdd.push({
          id: `custom_mat_${Date.now()}_${item.name}`,
          name: item.name,
          category: preset.category,
          emoji: item.emoji,
          syllables: item.name.split(''),
          firstSound: item.name[0],
          isCustom: true,
          enabled: true,
        });
      }
    }

    if (toAdd.length === 0) {
      speak(`이미 ${preset.title} 소재가 모두 등록되어 있습니다!`);
      setSelectedCategory(preset.category);
      return;
    }

    await saveCustomAssetsBatch(toAdd);
    if (!customCategories.includes(preset.category)) {
      const nextCats = [...customCategories, preset.category];
      setCustomCategories(nextCats);
      localStorage.setItem('toddler_custom_categories', JSON.stringify(nextCats));
    }
    const nextMats = [...materials, ...toAdd];
    setMaterials(nextMats);
    onMaterialsUpdated?.(nextMats);
    setSelectedCategory(preset.category);
    playSfx('success');
    speak(`${preset.title} ${toAdd.length}개가 등록되었습니다!`);
  };

  const handleToggleMaterial = async (mat: LearningMaterial) => {
    const updated: LearningMaterial = { ...mat, enabled: mat.enabled === false ? true : false };
    await saveCustomAsset(updated);
    const nextList = materials.map(m => m.id === mat.id ? updated : m);
    setMaterials(nextList);
    onMaterialsUpdated?.(nextList);
    playSfx('button');
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    await deleteCustomAsset(id);
    const nextList = materials.filter(m => m.id !== id);
    setMaterials(nextList);
    onMaterialsUpdated?.(nextList);
    playSfx('button');
    speak(`${name} 소재가 삭제되었습니다.`);
  };

  // Coloring Template Upload & Processing
  const processTplImageToOutline = (img: HTMLImageElement, thresholdVal: number, invert: boolean = false): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 530;
    canvas.height = 530;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 530, 530);

    const pad = 24;
    const scale = Math.min((530 - pad * 2) / img.width, (530 - pad * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (530 - w) / 2;
    const y = (530 - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    const imgData = ctx.getImageData(0, 0, 530, 530);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      let isLine = false;
      if (invert) {
        isLine = lum >= thresholdVal && a > 50;
      } else {
        isLine = lum < thresholdVal && a > 50;
      }

      if (isLine) {
        data[i] = 40;
        data[i + 1] = 40;
        data[i + 2] = 40;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (uploadTplRawImg) {
      const outline = processTplImageToOutline(uploadTplRawImg, uploadTplThreshold, uploadTplInvert);
      setUploadTplOutlineUrl(outline);
    }
  }, [uploadTplThreshold, uploadTplInvert, uploadTplRawImg]);

  const handleTplFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadTplTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setUploadTplTitle(baseName);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setUploadTplRawSrc(result);
      const img = new Image();
      img.onload = () => {
        setUploadTplRawImg(img);
        const outline = processTplImageToOutline(img, uploadTplThreshold, uploadTplInvert);
        setUploadTplOutlineUrl(outline);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomTpl = async () => {
    if (!uploadTplOutlineUrl) {
      alert('먼저 도안 이미지 파일을 선택해주세요.');
      return;
    }
    const title = uploadTplTitle.trim() || '새 맞춤 도안';
    const newTpl: ColoringTemplate = {
      id: `tpl_custom_${Date.now()}`,
      title,
      category: uploadTplCategory,
      svgPath: uploadTplOutlineUrl,
      isCustom: true,
    };
    await saveCustomTemplate(newTpl);
    const updated = [...templates, newTpl];
    setTemplates(updated);
    onTemplatesUpdated?.(updated);
    setShowTplUploadForm(false);
    setUploadTplRawSrc(null);
    setUploadTplOutlineUrl(null);
    setUploadTplRawImg(null);
    setUploadTplTitle('');
    playSfx('correct');
    speak(`${title} 도안이 성공적으로 등록되었습니다.`);
  };

  const handleDeleteTpl = async (id: string, title: string) => {
    if (!window.confirm(`'${title}' 맞춤 도안을 삭제할까요?`)) return;
    await deleteCustomTemplate(id);
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    onTemplatesUpdated?.(updated);
    playSfx('button');
    speak(`${title} 도안이 삭제되었습니다.`);
  };

  // CSV Export for Learning Analytics
  const handleExportCSV = () => {
    let csv = '날짜,학습시간(분),푼문제수,정답률(%)\n';
    usageList.forEach((u) => {
      csv += `${u.date},${u.minutes},${u.problemsSolved},${u.accuracy}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `유아학습통계_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // JSON Export / Import
  const handleExportJSON = async () => {
    const jsonStr = await exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `토끼배움터_백업_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await importAllData(evt.target?.result as string);
        alert('성공적으로 데이터를 복원했습니다.');
        loadAllDashboardData();
      } catch {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 select-none">
      <div className="relative w-full max-w-4xl h-[94dvh] bg-white rounded-3xl shadow-2xl border-4 border-amber-300 flex flex-col overflow-hidden text-stone-800">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 bg-amber-500 text-amber-950 border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-950" />
            <h2 className="font-kids text-lg sm:text-2xl font-bold">보호자 대시보드 & 설정</h2>
          </div>
          <button
            onClick={() => {
              playSfx('button');
              onClose();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-kids text-lg sm:text-xl active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-2.5 sm:px-6 py-1.5 sm:py-2.5 bg-amber-50 border-b border-amber-200 overflow-x-auto">
          {[
            { id: 'stats', label: '학습 통계', icon: BarChart3 },
            { id: 'settings', label: '앱 설정', icon: SettingsIcon },
            { id: 'messages', label: '사랑의 메시지', icon: MessageSquareHeart },
            { id: 'materials', label: '소재 관리', icon: Upload },
            { id: 'data', label: '데이터 백업', icon: Download },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  playSfx('button');
                  setTab(t.id as any);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-kids text-xs sm:text-sm md:text-base whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-amber-400 text-amber-950 shadow-sm border border-amber-500'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {/* TAB 1: STATS */}
          {tab === 'stats' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <span className="text-xs text-stone-500 block mb-1">오늘 학습 시간</span>
                  <strong className="text-2xl text-amber-900 font-kids">
                    {usageList[usageList.length - 1]?.minutes || 0} 분
                  </strong>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <span className="text-xs text-stone-500 block mb-1">오늘 푼 문제 수</span>
                  <strong className="text-2xl text-emerald-900 font-kids">
                    {usageList[usageList.length - 1]?.problemsSolved || 0} 개
                  </strong>
                </div>
                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200">
                  <span className="text-xs text-stone-500 block mb-1">평균 정답률</span>
                  <strong className="text-2xl text-sky-900 font-kids">
                    {usageList[usageList.length - 1]?.accuracy || 100}%
                  </strong>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                  <span className="text-xs text-stone-500 block mb-1">오답 복습 필요</span>
                  <strong className="text-2xl text-purple-900 font-kids">
                    {mistakesList.length} 개
                  </strong>
                </div>
              </div>

              {/* 14-Day History Table */}
              <div className="border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-kids text-lg text-stone-800">최근 14일 학습 기록</h4>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-kids text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>CSV 내보내기</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-stone-400 font-medium">
                        <th className="py-2">날짜</th>
                        <th className="py-2">학습 시간</th>
                        <th className="py-2">푼 문제</th>
                        <th className="py-2">정답률</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {usageList.map((u) => (
                        <tr key={u.date}>
                          <td className="py-2 text-stone-700">{u.date}</td>
                          <td className="py-2 text-stone-600">{u.minutes}분</td>
                          <td className="py-2 text-stone-600">{u.problemsSolved}문제</td>
                          <td className="py-2 text-emerald-600 font-bold">{u.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Review Mistakes Section */}
              <div className="border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-kids text-lg text-stone-800 flex items-center gap-2">
                    <span>📝</span> 오답노트 기록 현황
                  </h4>
                  <span className="text-xs text-stone-500 font-kids">
                    총 {allReviewItems.length}개 기록됨
                  </span>
                </div>
                {allReviewItems.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3 text-center font-kids">
                    아직 기록된 오답이 없습니다. 모든 문제를 훌륭히 풀고 있어요!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allReviewItems.slice(0, 15).map((r) => (
                      <div
                        key={r.id || r.timestamp}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{r.emoji || '💡'}</span>
                          <div>
                            <strong className="text-stone-800 font-kids block">{r.title}</strong>
                            <span className="text-stone-500">{r.questionText} (정답: {r.correctAnswer})</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-kids text-[10px] font-bold ${
                            r.graduated
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.graduated ? '완전 정복 ⭐' : '복습 필요 💡'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {tab === 'settings' && (
            <div className="space-y-6">
              {/* Time Limits */}
              <div className="border border-stone-200 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h4 className="font-kids text-lg text-stone-800">화면 이용 시간 제한</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 0].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleSettingChange('timeLimitMinutes', mins)}
                      className={`px-4 py-2 rounded-2xl font-kids text-sm transition-all ${
                        settings.timeLimitMinutes === mins
                          ? 'bg-amber-400 text-amber-950 font-bold border-2 border-amber-500'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {mins === 0 ? '무제한' : `${mins}분`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  종료 1분 전 음성 안내 후, 시간이 다 되면 잠자는 토끼 화면으로 전환됩니다.
                </p>
              </div>

              {/* TTS Voice Settings */}
              <div className="border border-stone-200 p-4 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-kids text-lg text-stone-800">음성 안내 (TTS) 설정</h4>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-500 mb-1">
                    <span>속도 (현재: {settings.speechRate})</span>
                    <span>빠름</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.2"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => handleSettingChange('speechRate', parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-500 mb-1">
                    <span>음조 (현재: {settings.speechPitch})</span>
                    <span>높음</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.6"
                    step="0.1"
                    value={settings.speechPitch}
                    onChange={(e) => handleSettingChange('speechPitch', parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <button
                  onClick={() => speak('안녕하세요! 저는 귀여운 토끼 친구예요!')}
                  className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-kids text-sm"
                >
                  🔊 목소리 시험 듣기
                </button>
              </div>

              {/* Control Interaction & Protection */}
              <div className="border border-stone-200 p-4 rounded-2xl space-y-4">
                <h4 className="font-kids text-lg text-stone-800">조작 및 보호자 확인 방식</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">숫자놀이 카드 선택 방식</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSettingChange('tapConfirmMode', '1tap')}
                      className={`px-3 py-1.5 rounded-xl font-kids text-xs ${
                        settings.tapConfirmMode === '1tap'
                          ? 'bg-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      1탭 확정
                    </button>
                    <button
                      onClick={() => handleSettingChange('tapConfirmMode', '2tap')}
                      className={`px-3 py-1.5 rounded-xl font-kids text-xs ${
                        settings.tapConfirmMode === '2tap'
                          ? 'bg-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      2탭 확정(세어주기)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">보호자 확인 게이트 방식</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSettingChange('parentGateMethod', 'math')}
                      className={`px-3 py-1.5 rounded-xl font-kids text-xs ${
                        settings.parentGateMethod === 'math'
                          ? 'bg-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      두 자리 덧셈
                    </button>
                    <button
                      onClick={() => handleSettingChange('parentGateMethod', 'hold')}
                      className={`px-3 py-1.5 rounded-xl font-kids text-xs ${
                        settings.parentGateMethod === 'hold'
                          ? 'bg-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      3초 길게 누르기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENCOURAGING MESSAGES */}
          {tab === 'messages' && (
            <div className="space-y-6">
              <div className="border border-stone-200 p-4 rounded-2xl">
                <h4 className="font-kids text-lg text-stone-800 mb-2">새 격려 메시지 등록</h4>
                <div className="flex gap-2 mb-3">
                  <select
                    value={msgAuthor}
                    onChange={(e) => setMsgAuthor(e.target.value)}
                    className="p-2 border rounded-xl font-kids text-sm bg-stone-50"
                  >
                    <option value="엄마">엄마</option>
                    <option value="아빠">아빠</option>
                    <option value="할머니">할머니</option>
                    <option value="할아버지">할아버지</option>
                    <option value="선생님">선생님</option>
                  </select>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="최대 50자까지 입력하세요"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    className="flex-1 p-2 border rounded-xl text-sm"
                  />
                  <button
                    onClick={handleSaveMessage}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-kids rounded-xl text-sm active:scale-95"
                  >
                    등록 및 읽기
                  </button>
                </div>

                {/* Templates */}
                <span className="text-xs text-stone-400 block mb-2">빠른 템플릿 선택:</span>
                <div className="flex flex-wrap gap-1.5">
                  {ENCOURAGING_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => setNewMsgText(tmpl)}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-2">
                <h4 className="font-kids text-base text-stone-700">등록된 메시지 목록</h4>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-200"
                  >
                    <div>
                      <strong className="text-amber-900 font-kids text-sm mr-2">{m.author}:</strong>
                      <span className="text-stone-700 text-sm">{m.text}</span>
                    </div>
                    <button
                      onClick={() => speak(`${m.author}가 말했어요: ${m.text}`)}
                      className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl font-kids text-xs text-amber-900"
                    >
                      🔊 재생
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MATERIALS & CATEGORY & TEMPLATE MANAGEMENT */}
          {tab === 'materials' && (
            <div className="space-y-6">
              {/* Sub-tab Navigation */}
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                <button
                  onClick={() => {
                    playSfx('button');
                    setMaterialsSubTab('words');
                  }}
                  className={`px-3.5 py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    materialsSubTab === 'words'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>학습 단어 & 카테고리 관리 ({materials.length})</span>
                </button>
                <button
                  onClick={() => {
                    playSfx('button');
                    setMaterialsSubTab('templates');
                  }}
                  className={`px-3.5 py-2 rounded-2xl font-kids text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    materialsSubTab === 'templates'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>색칠 도안 직접 올리기 & 관리 ({templates.length})</span>
                </button>
              </div>

              {materialsSubTab === 'words' && (
                <div className="space-y-6">
                  {/* Category Filter Chips Bar */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-700" />
                    <h4 className="font-kids text-base sm:text-lg text-amber-950 font-bold">
                      카테고리 선택 및 관리
                    </h4>
                    <span className="text-xs bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                      총 {allCategories.length}개 카테고리
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPresets(!showPresets)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl font-kids text-xs text-amber-900 shadow-sm transition active:scale-95"
                    >
                      <Package className="w-4 h-4 text-amber-600" />
                      인기 캐릭터 세트 {showPresets ? '접기 ▲' : '펼치기 ▼'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCategoryModal(!showNewCategoryModal);
                        setNewCategoryInput('');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-kids text-xs shadow-sm transition active:scale-95"
                    >
                      <FolderPlus className="w-4 h-4" />
                      + 새 카테고리 만들기
                    </button>
                  </div>
                </div>

                {/* Inline New Category Creator */}
                {showNewCategoryModal && (
                  <div className="p-3 bg-white rounded-2xl border-2 border-amber-300 shadow-sm space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 font-kids">
                        ✨ 새로 만들 카테고리 이름 입력 (예: 뽀로로, 아기상어, 포켓몬, 공룡)
                      </span>
                      <button
                        onClick={() => setShowNewCategoryModal(false)}
                        className="text-stone-400 hover:text-stone-600 text-xs"
                      >
                        ✕ 닫기
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="새 카테고리명 (예: 뽀로로, 아기상어)"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateCategory(newCategoryInput);
                        }}
                        className="flex-1 px-3 py-1.5 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => handleCreateCategory(newCategoryInput)}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-kids rounded-xl text-xs font-bold active:scale-95"
                      >
                        추가하기
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-stone-500">추천 카테고리:</span>
                      {['뽀로로', '아기상어', '공룡', '바다친구', '곤충', '우주', '꽃과식물'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleCreateCategory(cat)}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs"
                        >
                          {getCategoryIcon(cat)} {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Pre-built Bundles */}
                {showPresets && (
                  <div className="p-3 bg-white/90 rounded-2xl border border-amber-300 space-y-2">
                    <div className="text-xs font-bold text-amber-900 font-kids flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      원클릭 인기 캐릭터 세트 추가 (아이들이 제일 좋아하는 캐릭터!)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {RECOMMENDED_PRESETS.map((preset) => {
                        const existingCount = preset.items.filter(it => materials.some(m => m.name === it.name)).length;
                        const isAllInstalled = existingCount === preset.items.length;
                        return (
                          <div
                            key={preset.category}
                            className="p-2.5 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">{preset.icon}</span>
                                <strong className="font-kids text-xs text-amber-950">{preset.title}</strong>
                              </div>
                              <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                                {preset.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handleInstallPreset(preset)}
                              disabled={isAllInstalled}
                              className={`px-3 py-1.5 rounded-xl font-kids text-xs font-bold shrink-0 transition active:scale-95 ${
                                isAllInstalled
                                  ? 'bg-stone-200 text-stone-500 cursor-default'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                              }`}
                            >
                              {isAllInstalled ? '✓ 등록됨' : '+ 전체 추가'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Chips Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1">
                  <button
                    onClick={() => {
                      playSfx('button');
                      setSelectedCategory('전체');
                    }}
                    className={`px-3.5 py-1.5 rounded-2xl font-kids text-xs whitespace-nowrap transition-all ${
                      selectedCategory === '전체'
                        ? 'bg-amber-600 text-white shadow-md font-bold scale-105'
                        : 'bg-white hover:bg-amber-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    🌟 전체 ({materials.length})
                  </button>

                  {allCategories.map((cat) => {
                    const count = materials.filter(m => m.category === cat).length;
                    const isSelected = selectedCategory === cat;
                    const isCustomCat = !DEFAULT_CATEGORIES.includes(cat) || materials.some(m => m.category === cat && m.isCustom);
                    return (
                      <div key={cat} className="flex items-center shrink-0">
                        <button
                          onClick={() => {
                            playSfx('button');
                            setSelectedCategory(cat);
                            setNewAssetCategory(cat);
                          }}
                          className={`px-3 py-1.5 rounded-2xl font-kids text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-md font-bold scale-105'
                              : 'bg-white hover:bg-amber-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          <span>{getCategoryIcon(cat)}</span>
                          <span>{cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-800/50 text-white' : 'bg-stone-100 text-stone-500'}`}>
                            {count}
                          </span>
                        </button>
                        {isCustomCat && isSelected && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            title="이 카테고리 삭제"
                            className="ml-1 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add custom learning material Form */}
              <div className="border-2 border-emerald-300 bg-emerald-50/40 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                    <h4 className="font-kids text-base sm:text-lg text-emerald-950 font-bold">
                      새 학습 단어 등록 (뽀로로, 크롱, 엄마상어 등)
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-bold">
                    퀴즈 & 게임에 즉시 반영
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      카테고리 선택
                    </label>
                    <select
                      value={isDirectCategoryInput ? '__custom__' : newAssetCategory}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsDirectCategoryInput(true);
                        } else {
                          setIsDirectCategoryInput(false);
                          setNewAssetCategory(e.target.value);
                          setNewAssetEmoji(suggestEmojiForName(newAssetName, e.target.value));
                        }
                      }}
                      className="w-full p-2.5 border border-stone-300 rounded-xl font-kids text-sm bg-white focus:ring-2 focus:ring-emerald-400"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryIcon(cat)} {cat}
                        </option>
                      ))}
                      <option value="__custom__">➕ [새 카테고리 직접 입력]</option>
                    </select>
                  </div>

                  {/* Direct category input if chosen */}
                  {isDirectCategoryInput ? (
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                        새 카테고리명 직접 입력
                      </label>
                      <input
                        type="text"
                        placeholder="예: 뽀로로, 아기상어"
                        value={directCategoryName}
                        onChange={(e) => setDirectCategoryName(e.target.value)}
                        className="w-full p-2.5 border-2 border-emerald-400 rounded-xl text-sm bg-white font-kids"
                      />
                    </div>
                  ) : null}

                  {/* Word Name */}
                  <div className={isDirectCategoryInput ? 'sm:col-span-2 md:col-span-1' : ''}>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      단어 이름 (예: 크롱, 엄마상어)
                    </label>
                    <input
                      type="text"
                      placeholder="단어 이름 (예: 크롱, 엄마상어)"
                      value={newAssetName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewAssetName(val);
                        const cat = isDirectCategoryInput ? directCategoryName : newAssetCategory;
                        setNewAssetEmoji(suggestEmojiForName(val, cat));
                      }}
                      className="w-full p-2.5 border border-stone-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Emoji Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      이모지 / 아이콘
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="이모지 (예: 🦖)"
                        value={newAssetEmoji}
                        onChange={(e) => setNewAssetEmoji(e.target.value)}
                        className="flex-1 p-2.5 border border-stone-300 rounded-xl text-base text-center bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAssetName.trim()) {
                            speak(newAssetName.trim());
                          } else {
                            speak('이름을 먼저 입력해주세요.');
                          }
                        }}
                        title="음성 발음 미리듣기"
                        className="px-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-xs flex items-center justify-center text-stone-700"
                      >
                        <Volume2 className="w-4 h-4 text-emerald-700" />
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateAsset}
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-kids rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      소재 등록하기
                    </button>
                  </div>
                </div>

                {/* Quick Emoji Palette */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-stone-500">빠른 이모지:</span>
                  {['🦖', '🦈', '🐧', '🐻', '🦊', '🌸', '🦁', '🐶', '🐱', '🚗', '✈️', '🍎', '🥕', '⭐', '👶', '👩', '👨'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewAssetEmoji(em)}
                      className="w-7 h-7 flex items-center justify-center text-base rounded-lg bg-white border border-stone-200 hover:border-emerald-400 hover:scale-110 transition"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Material Filter Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-kids text-base text-stone-800">
                    등록된 소재 목록 ({selectedCategory} {materials.filter(m => selectedCategory === '전체' || m.category === selectedCategory).length}개)
                  </h4>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="단어 또는 카테고리 검색..."
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Materials list */}
              {(() => {
                const filtered = materials.filter(m => {
                  const matchCat = selectedCategory === '전체' || m.category === selectedCategory;
                  const matchQuery = !materialSearchQuery.trim() || 
                    m.name.includes(materialSearchQuery.trim()) || 
                    m.category.includes(materialSearchQuery.trim());
                  return matchCat && matchQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                      <p className="text-stone-500 font-kids text-sm mb-2">
                        {selectedCategory === '전체'
                          ? '등록된 소재가 없습니다.'
                          : `'${selectedCategory}' 카테고리에 등록된 소재가 없습니다.`}
                      </p>
                      <button
                        onClick={() => {
                          setNewAssetCategory(selectedCategory === '전체' ? '과일' : selectedCategory);
                          setNewAssetName('');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-kids text-xs rounded-xl shadow-sm"
                      >
                        + 이 카테고리에 첫 단어 등록하기
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {filtered.map((mat) => {
                      const isEnabled = mat.enabled !== false;
                      return (
                        <div
                          key={mat.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                            isEnabled
                              ? 'bg-white border-stone-200 shadow-sm hover:shadow-md'
                              : 'bg-stone-100/80 border-stone-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-3xl select-none">{mat.emoji || '✨'}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => speak(mat.name)}
                                title="발음 듣기"
                                className="p-1 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              {mat.isCustom && (
                                <button
                                  onClick={() => handleDeleteMaterial(mat.id, mat.name)}
                                  title="소재 삭제"
                                  className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="font-kids text-stone-900 text-base font-bold block">
                              {mat.name}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-kids">
                                {getCategoryIcon(mat.category)} {mat.category}
                              </span>
                              <button
                                onClick={() => handleToggleMaterial(mat)}
                                title={isEnabled ? '놀이에서 숨기기' : '놀이에 포함하기'}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-kids ${
                                  isEnabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {isEnabled ? '사용 중' : '숨김'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
                </div>
              )}

              {/* TEMPLATES SUB-TAB */}
              {materialsSubTab === 'templates' && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-3xl flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-kids text-base sm:text-lg text-amber-950 font-bold">
                        색칠 놀이 도안 관리 (총 {templates.length}개)
                      </h4>
                      <p className="text-xs text-stone-500">
                        컴퓨터나 스마트폰에 있는 사진/도안을 올려 색칠 도안으로 자동 변환할 수 있습니다.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowTplUploadForm(!showTplUploadForm)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-kids text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showTplUploadForm ? '업로드 닫기' : '+ 새 도안 직접 올리기'}</span>
                    </button>
                  </div>

                  {/* Upload Form */}
                  {showTplUploadForm && (
                    <div className="border-2 border-emerald-300 bg-emerald-50/40 p-4 rounded-3xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="font-kids text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          새 색칠 도안 이미지 업로드 및 외곽선 변환
                        </span>
                        <button
                          onClick={() => setShowTplUploadForm(false)}
                          className="text-stone-400 hover:text-stone-600 text-xs"
                        >
                          ✕ 닫기
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            도안 이름
                          </label>
                          <input
                            type="text"
                            placeholder="예: 우리집 고양이, 뽀로로 도안"
                            value={uploadTplTitle}
                            onChange={(e) => setUploadTplTitle(e.target.value)}
                            className="w-full p-2.5 border border-stone-300 rounded-xl text-sm bg-white font-kids"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            카테고리
                          </label>
                          <select
                            value={uploadTplCategory}
                            onChange={(e) => setUploadTplCategory(e.target.value)}
                            className="w-full p-2.5 border border-stone-300 rounded-xl text-sm bg-white font-kids"
                          >
                            <option value="캐릭터">캐릭터</option>
                            <option value="동물">동물</option>
                            <option value="탈것">탈것</option>
                            <option value="공룡">공룡</option>
                            <option value="과일">과일</option>
                            <option value="자유">자유</option>
                          </select>
                        </div>
                      </div>

                      {/* File input */}
                      <div>
                        <input
                          type="file"
                          ref={tplFileInputRef}
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                          onChange={handleTplFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => tplFileInputRef.current?.click()}
                          className="w-full py-4 px-4 border-2 border-dashed border-emerald-400 hover:border-emerald-500 rounded-2xl bg-white flex flex-col items-center justify-center gap-1 transition active:scale-[0.99] cursor-pointer"
                        >
                          <Upload className="w-5 h-5 text-emerald-600" />
                          <span className="font-kids text-sm text-emerald-950 font-bold">
                            도안 사진 또는 그림 파일 선택 (PNG, JPG, SVG)
                          </span>
                        </button>
                      </div>

                      {/* Threshold adjust & preview */}
                      {uploadTplOutlineUrl && (
                        <div className="p-3 bg-white rounded-2xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-700 font-kids">
                              외곽선 선명도 조절:
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={uploadTplInvert}
                                onChange={(e) => setUploadTplInvert(e.target.checked)}
                                className="rounded text-emerald-600"
                              />
                              <span>흑백 반전</span>
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-stone-500">연하게</span>
                            <input
                              type="range"
                              min={60}
                              max={220}
                              value={uploadTplThreshold}
                              onChange={(e) => setUploadTplThreshold(Number(e.target.value))}
                              className="w-full accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-[11px] text-stone-500">진하게</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="flex flex-col items-center">
                              <span className="text-[11px] text-stone-500 mb-1">원본</span>
                              <div className="w-full h-32 bg-stone-50 rounded-xl border border-stone-200 p-2 flex items-center justify-center overflow-hidden">
                                {uploadTplRawSrc && (
                                  <img src={uploadTplRawSrc} alt="원본" className="max-w-full max-h-full object-contain" />
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[11px] text-emerald-700 font-bold mb-1">변환된 색칠 도안</span>
                              <div className="w-full h-32 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-white rounded-xl border border-emerald-400 p-2 flex items-center justify-center overflow-hidden">
                                <img src={uploadTplOutlineUrl} alt="도안 미리보기" className="max-w-full max-h-full object-contain" />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveCustomTpl}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-kids text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>도안 저장하기</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* List of templates */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto p-1">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between gap-2"
                      >
                        <div className="w-full h-28 bg-[radial-gradient(#f3f4f6_1px,transparent_1px)] [background-size:10px_10px] bg-white rounded-xl border border-stone-200 p-2 flex items-center justify-center overflow-hidden">
                          {tpl.svgPath.startsWith('data:image/') || tpl.svgPath.startsWith('blob:') || tpl.svgPath.startsWith('http') ? (
                            <img src={tpl.svgPath} alt={tpl.title} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <svg viewBox="0 0 530 530" className="w-full h-full max-w-full max-h-full" dangerouslySetInnerHTML={{ __html: tpl.svgPath }} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <strong className="font-kids text-stone-900 text-sm truncate">
                              {tpl.title}
                            </strong>
                            {tpl.isCustom && (
                              <button
                                onClick={() => handleDeleteTpl(tpl.id, tpl.title)}
                                title="도안 삭제"
                                className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-kids mt-1 inline-block">
                            {tpl.category} {tpl.isCustom && '· 맞춤도안'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATA */}
          {tab === 'data' && (
            <div className="space-y-6">
              <div className="border border-stone-200 p-4 rounded-2xl space-y-4">
                <h4 className="font-kids text-lg text-stone-800">데이터 백업 및 복원</h4>
                <p className="text-xs text-stone-500">
                  아이의 스티커, 그림 작품, 학습 기록을 JSON 파일로 안전하게 백업하거나 기기 변경 시 복원할 수 있습니다.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-kids text-sm shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>백업 파일 저장하기</span>
                  </button>

                  <label className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-kids text-sm shadow-md cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>백업 파일 가져오기</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Factory Reset */}
              <div className="border border-rose-200 bg-rose-50/50 p-4 rounded-2xl space-y-3">
                <h4 className="font-kids text-lg text-rose-800">앱 전체 초기화</h4>
                <p className="text-xs text-stone-500">
                  모든 학습 기록, 그린 그림, 스티커북이 처음 상태로 초기화됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
                      await resetAllData();
                      alert('초기화가 완료되었습니다.');
                      window.location.reload();
                    }
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-kids text-sm shadow-md active:scale-95"
                >
                  전체 초기화 실행
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
