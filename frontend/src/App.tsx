import { useState, useCallback, useRef, useEffect } from 'react';
import './index.css';
import { api } from './api';
import {
  Character,
  Event as GameEvent,
  SelectResult,
  GamePhase,
  Choice,
  TurnSummaryItem,
  CreateCharacterParams,
  ActionResult,
} from './types';
import { useI18n, Lang } from './i18n';

/* ===== HELPER: Pick translated text ===== */
function tc(en: string, vi: string | undefined, lang: Lang): string {
  return lang === 'vi' && vi ? vi : en;
}

/* ===== HELPER: Check choice availability ===== */
function isChoiceAvailable(choice: Choice, character: Character): boolean {
  if (!choice.display_conditions) return true;
  const c = choice.display_conditions;
  if (c.min_money !== undefined && character.money < c.min_money) return false;
  if (c.min_health !== undefined && character.health < c.min_health) return false;
  if (c.min_happiness !== undefined && character.happiness < c.min_happiness) return false;
  if (c.requires_flags) {
    const flags = Array.isArray(c.requires_flags) ? c.requires_flags : [c.requires_flags];
    if (!flags.every((flag: string) => character.flags[flag])) return false;
  }
  if (c.excludes_flags) {
    const flags = Array.isArray(c.excludes_flags) ? c.excludes_flags : [c.excludes_flags];
    if (flags.some((flag: string) => character.flags[flag])) return false;
  }
  return true;
}

/* ===== HELPER: Format money ===== */
function formatMoney(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/* ===== BACKGROUND STATS ===== */
const BACKGROUNDS = {
  poor: { money: 200, health: 90, happiness: 40, emoji: '🏚️' },
  middle: { money: 500, health: 80, happiness: 50, emoji: '🏡' },
  rich: { money: 1000, health: 70, happiness: 60, emoji: '🏰' },
} as const;

/* ===== Types for timeline history ===== */
interface TimelineEntry {
  age: number;
  events: ResolvedEvent[];
  summary: TurnSummaryItem[];
  peaceful: boolean;
}

interface ResolvedEvent {
  event: GameEvent;
  result: SelectResult;
}

/* ===== COMPONENT: LangSwitcher ===== */
function LangSwitcher() {
  const { lang, toggleLang } = useI18n();
  return (
    <button className="lang-switcher" onClick={toggleLang} id="lang-switcher">
      🌐 {lang.toUpperCase()}
    </button>
  );
}

/* ===== COMPONENT: StartScreen ===== */
function StartScreen({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <div className="start-screen">
      <div className="start-screen__logo">🌟</div>
      <h1 className="start-screen__title">{t.startTitle}</h1>
      <p className="start-screen__subtitle">{t.startSubtitle}</p>
      <button className="start-screen__btn" onClick={onStart} id="start-btn">{t.startButton}</button>
      <div className="start-screen__features">
        <div className="start-screen__feature"><span className="start-screen__feature-icon">🎲</span><span>{t.featureRandom}</span></div>
        <div className="start-screen__feature"><span className="start-screen__feature-icon">📖</span><span>{t.featureEvents}</span></div>
        <div className="start-screen__feature"><span className="start-screen__feature-icon">🔄</span><span>{t.featureReplay}</span></div>
        <div className="start-screen__feature"><span className="start-screen__feature-icon">⚡</span><span>{t.featureEndings}</span></div>
      </div>
    </div>
  );
}

/* ===== COMPONENT: CreateCharacterScreen ===== */
function CreateCharacterScreen({ onCreated, loading }: { onCreated: (p: CreateCharacterParams) => void; loading: boolean }) {
  const { t, lang } = useI18n();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const handleSubmit = () => {
    if (loading) return;
    // Randomize background
    const backgrounds: Array<'poor' | 'middle' | 'rich'> = ['poor', 'middle', 'rich'];
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    onCreated({ name: name.trim() || (lang === 'vi' ? 'Người chơi' : 'Player'), gender, background: randomBackground });
  };

  return (
    <div className="create-screen">
      <div className="create-screen__card">
        <div className="create-screen__header">
          <h1 className="create-screen__title">{t.createTitle}</h1>
          <p className="create-screen__subtitle">{t.createSubtitle}</p>
        </div>
        <div className="create-field">
          <label className="create-field__label">{t.nameLabel}</label>
          <input className="create-field__input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} id="name-input" maxLength={30} />
        </div>
        <div className="create-field">
          <label className="create-field__label">{t.genderLabel}</label>
          <div className="create-field__options create-field__options--2">
            <button className={`create-option ${gender === 'male' ? 'create-option--active' : ''}`} onClick={() => setGender('male')} id="gender-male">
              <span className="create-option__emoji">👦</span><span className="create-option__text">{lang === 'vi' ? 'Nam' : 'Male'}</span>
            </button>
            <button className={`create-option ${gender === 'female' ? 'create-option--active' : ''}`} onClick={() => setGender('female')} id="gender-female">
              <span className="create-option__emoji">👧</span><span className="create-option__text">{lang === 'vi' ? 'Nữ' : 'Female'}</span>
            </button>
          </div>
        </div>
        <button className="create-screen__submit" onClick={handleSubmit} disabled={loading} id="create-btn">
          {loading ? (lang === 'vi' ? 'Đang tạo...' : 'Creating...') : t.createButton}
        </button>
        {/* DEV: Quick start at age 17 - REMOVE IN PRODUCTION */}
        {/* <button className="create-screen__submit" style={{ marginTop: '10px', background: '#ef4444' }} onClick={() => {
          if (loading) return;
          const backgrounds: Array<'poor' | 'middle' | 'rich'> = ['poor', 'middle', 'rich'];
          const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
          onCreated({ name: name.trim() || (lang === 'vi' ? 'Người chơi' : 'Player'), gender, background: randomBackground, age: 17 });
        }} disabled={loading}>
          🚀 DEV: Start at 17
        </button> */}
      </div>
    </div>
  );
}

/* ===== COMPONENT: CharacterHeader ===== */
function CharacterHeader({ character }: { character: Character }) {
  const { t, lang } = useI18n();
  const genderEmoji = character.gender === 'male' ? '👦' : '👧';
  const genderText = character.gender === 'male' ? (lang === 'vi' ? 'Nam' : 'Male') : (lang === 'vi' ? 'Nữ' : 'Female');
  const age = character.age;
  const flags = character.flags || {};

  const stageName =
    age < 6 ? (lang === 'vi' ? '👶 Sơ sinh' : '👶 Infant') :
      age < 18 ? (lang === 'vi' ? '🧒 Tuổi Thơ' : '🧒 Childhood') :
        flags.is_grad_student ? (lang === 'vi' ? '🎓 Cao Học' : '🎓 Grad School') :
          flags.is_student ? (lang === 'vi' ? '🎓 Đại Học' : '🎓 University') :
            flags.is_employed ? (lang === 'vi' ? '💼 Đi Làm' : '💼 Working') :
              age < 30 ? (lang === 'vi' ? '💼 Sự Nghiệp' : '💼 Career') :
                age < 40 ? (lang === 'vi' ? '💑 Gia Đình' : '💑 Family') :
                  age < 60 ? (lang === 'vi' ? '👨‍👩‍👦 Nuôi Con' : '👨‍👩‍👦 Parenting') :
                    (lang === 'vi' ? '🏖️ Nghỉ Hưu' : '🏖️ Retirement');

  return (
    <div className="char-header">
      <div className="char-header__left">
        <div className="char-header__name">{character.name || 'Player'}</div>
        <div className="char-header__meta">
          <span className="char-header__badge">🎂 {t.statAge}: {character.age}</span>
          <span className="char-header__badge">{genderEmoji} {genderText}</span>
          <span className="char-header__badge char-header__badge--stage">{stageName}</span>
          {flags.has_grad_degree && (
            <span className="char-header__badge" style={{ background: '#8b5cf6' }}>🎓 {lang === 'vi' ? 'Thạc sĩ' : 'Master\'s'}</span>
          )}
          {flags.has_degree && !flags.has_grad_degree && (
            <span className="char-header__badge" style={{ background: '#3b82f6' }}>🎓 {lang === 'vi' ? 'Đại học' : 'Bachelor\'s'}</span>
          )}
        </div>
      </div>
      <div className="char-header__right">
        <div className="char-header__stat char-header__stat--money">
          <span className="char-header__stat-icon">💰</span>
          <span className="char-header__stat-value">{formatMoney(character.money)}</span>
        </div>
        <div className="char-header__stat char-header__stat--health">
          <span className="char-header__stat-icon">❤️</span>
          <div className="char-header__stat-bar"><div className="char-header__stat-fill char-header__stat-fill--health" style={{ width: `${character.health}%` }} /></div>
          <span className="char-header__stat-num">{character.health}</span>
        </div>
        <div className="char-header__stat char-header__stat--happiness">
          <span className="char-header__stat-icon">😊</span>
          <div className="char-header__stat-bar"><div className="char-header__stat-fill char-header__stat-fill--happiness" style={{ width: `${character.happiness}%` }} /></div>
          <span className="char-header__stat-num">{character.happiness}</span>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENT: ActionButtons ===== */
function ActionButtons({ onOpen }: { onOpen: (panel: string) => void }) {
  const { t, lang } = useI18n();
  return (
    <div className="action-buttons">
      <button className="action-btn action-btn--rel" onClick={() => onOpen('relationships')} id="btn-relationships">
        <span className="action-btn__icon">👨‍👩‍👦</span><span className="action-btn__label">{t.btnRelationships}</span>
      </button>
      <button className="action-btn action-btn--job" onClick={() => onOpen('job')} id="btn-job">
        <span className="action-btn__icon">💼</span><span className="action-btn__label">{t.btnJob}</span>
      </button>
      <button className="action-btn action-btn--assets" onClick={() => onOpen('assets')} id="btn-assets">
        <span className="action-btn__icon">🏠</span><span className="action-btn__label">{t.btnAssets}</span>
      </button>
      <button className="action-btn action-btn--health" onClick={() => onOpen('health')} id="btn-health">
        <span className="action-btn__icon">❤️</span><span className="action-btn__label">{lang === 'vi' ? 'Sức khỏe' : 'Health'}</span>
      </button>
    </div>
  );
}

/* ===== COMPONENT: PopupOverlay (reusable) ===== */
function PopupOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-card__header">
          <h2 className="popup-card__title">{title}</h2>
          <button className="popup-card__close" onClick={onClose}>✕</button>
        </div>
        <div className="popup-card__body">{children}</div>
        <button className="popup-card__btn" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  );
}

/* ===== COMPONENT: ActionResult banner ===== */
type ActionResult = { success: boolean; message_en: string; message_vi: string; stat_changes?: Record<string, number> };

function ActionResultBanner({ result, lang }: { result: ActionResult; lang: Lang }) {
  const statIcons: Record<string, string> = { health: '❤️', money: '💰', happiness: '😊' };
  return (
    <div className={`action-result ${result.success ? 'action-result--ok' : 'action-result--fail'}`}>
      <span className="action-result__msg">{lang === 'vi' ? result.message_vi : result.message_en}</span>
      {result.stat_changes && (
        <div className="action-result__changes">
          {Object.entries(result.stat_changes).map(([stat, val]) => (
            <span key={stat} className={`stat-change-sm ${val >= 0 ? 'stat-change-sm--pos' : 'stat-change-sm--neg'}`}>
              {statIcons[stat] || '📊'} {val >= 0 ? '+' : ''}{stat === 'money' ? formatMoney(val) : val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== COMPONENT: RelationshipPopup (interactive) ===== */
function RelationshipPopup({ character, onClose, onAction, onShowResult }: { character: Character; onClose: () => void; onAction: (a: string, p?: any) => Promise<ActionResult>; onShowResult?: (r: ActionResult) => void }) {
  const { t, lang } = useI18n();
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const family = character.family;

  const doAction = async (type: string, params?: any) => {
    setBusy(true); setActionResult(null);
    try { const r = await onAction(type, params); setActionResult(r); }
    catch { setActionResult({ success: false, message_en: 'Error', message_vi: 'Lỗi' }); }
    setBusy(false);
  };

  const getRelationshipEmoji = (quality?: number) => {
    if (!quality && quality !== 0) return '💛'; // Default if undefined
    if (quality >= 80) return '💚';
    if (quality >= 60) return '💛';
    if (quality >= 40) return '🧡';
    return '❤️‍🩹';
  };

  const renderMember = (label: string, member: { name: string; age: number; deceased?: boolean; relationship_quality?: number } | null) => (
    <div className="popup-row">
      <span className="popup-row__label">{label}</span>
      {member ? (<div className="popup-row__info">
        <span className="popup-row__name">{member.name}{member.deceased ? ' 🕊️' : ''} {!member.deceased && getRelationshipEmoji(member.relationship_quality)}</span>
        <span className="popup-row__detail">
          {member.deceased ? (lang === 'vi' ? 'Đã mất' : 'Deceased') : `${t.relAge}: ${member.age}`}
          {!member.deceased && ` • ${member.relationship_quality || 50}%`}
        </span>
      </div>) : (<span className="popup-row__none">{t.relNone}</span>)}
    </div>
  );

  const hasSpouse = family?.spouse && !family.spouse.deceased;
  const hasParents = (family?.father && !family.father.deceased) || (family?.mother && !family.mother.deceased);
  const hasFamily = hasSpouse || character.flags?.has_child;

  return (
    <PopupOverlay title={`👨‍👩‍👦 ${t.relTitle}`} onClose={onClose}>
      {renderMember(`👨 ${t.relFather}`, family?.father)}
      {renderMember(`👩 ${t.relMother}`, family?.mother)}
      {renderMember(`💍 ${t.relSpouse}`, family?.spouse)}
      <div className="popup-row">
        <span className="popup-row__label">👶 {t.relChildren}</span>
        {family?.children && family.children.length > 0 ? (
          <div className="popup-row__list">
            {family.children.map((child, i) => (
              <div key={i} className="popup-row__info">
                <span className="popup-row__name">{child.name} {getRelationshipEmoji(child.relationship_quality)}</span>
                <span className="popup-row__detail">{t.relAge}: {child.age} • {child.relationship_quality || 50}%</span>
              </div>
            ))}
          </div>
        ) : (<span className="popup-row__none">{t.relNone}</span>)}
      </div>

      {actionResult && <ActionResultBanner result={actionResult} lang={lang} />}

      {/* Marriage Proposal Popup */}
      {actionResult?.proposal && (
        <div className="popup-overlay">
          <div className="outcome-popup" onClick={(e) => e.stopPropagation()}>
            <div className="outcome-popup__dice">💍</div>
            <p className="outcome-popup__message">{lang === 'vi' ? actionResult.message_vi : actionResult.message_en}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="outcome-popup__btn" style={{ flex: 1, background: '#22c55e' }} onClick={async () => {
                const result = await doAction('accept_proposal', { partner_name: actionResult.partner_name });
                if (result.success) {
                  onClose();
                  if (onShowResult) onShowResult(result);
                } else {
                  setActionResult(result);
                }
              }}>
                {lang === 'vi' ? '💍 Kết hôn' : '💍 Marry'}
              </button>
              <button className="outcome-popup__btn" style={{ flex: 1, background: '#ef4444' }} onClick={async () => {
                const result = await doAction('reject_proposal');
                setActionResult(result);
              }}>
                {lang === 'vi' ? '❌ Từ chối' : '❌ Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="popup-actions">
        {!hasSpouse && character.age >= 18 && (
          <button className="popup-action-btn popup-action-btn--primary" onClick={() => doAction('find_date')} disabled={busy}>
            💕 {lang === 'vi' ? 'Tìm người yêu ($50)' : 'Find date ($50)'}
          </button>
        )}
        {hasSpouse && (
          <>
            <button className="popup-action-btn" onClick={() => doAction('gift_spouse')} disabled={busy}>
              🎁 {lang === 'vi' ? 'Tặng quà vợ/chồng ($30)' : 'Gift spouse ($30)'}
            </button>
            <button className="popup-action-btn" onClick={() => doAction('quality_time_spouse')} disabled={busy}>
              💑 {lang === 'vi' ? 'Hẹn hò ($20)' : 'Date night ($20)'}
            </button>
            <button className="popup-action-btn" onClick={() => doAction('resolve_conflict')} disabled={busy}>
              🤝 {lang === 'vi' ? 'Tư vấn cặp đôi ($50)' : 'Couples therapy ($50)'}
            </button>
          </>
        )}
        {hasParents && (
          <button className="popup-action-btn" onClick={() => doAction('gift_parents')} disabled={busy}>
            🎁 {lang === 'vi' ? 'Tặng quà bố mẹ ($40)' : 'Gift parents ($40)'}
          </button>
        )}
        {hasFamily && (
          <button className="popup-action-btn popup-action-btn--primary" onClick={() => doAction('family_vacation')} disabled={busy}>
            ✈️ {lang === 'vi' ? 'Nghỉ dưỡng gia đình ($100)' : 'Family vacation ($100)'}
          </button>
        )}
      </div>
    </PopupOverlay>
  );
}

/* ===== COMPONENT: JobPopup (view + select/quit) ===== */
function JobPopup({ character, onClose, onAction, onSelectJob }: { character: Character; onClose: () => void; onAction: (a: string) => Promise<ActionResult>; onSelectJob?: (jobType: string) => Promise<void>; }) {
  const { t, lang } = useI18n();
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const job = character.job;
  const hasJob = job && (job.title_en || job.title_vi) && character.flags?.is_employed;
  const isEmployed = character.flags?.is_employed;
  const flags = character.flags || {};

  // Check if job button should be available
  const canWorkAge18 = character.age >= 18 && !flags.is_student && !flags.is_grad_student;
  const canWorkAge22 = character.age >= 22 && !flags.is_grad_student;
  const canFindJob = canWorkAge18 || canWorkAge22;

  const doAction = async (type: string, params?: any) => {
    setBusy(true); setActionResult(null);
    try { const r = await onAction(type, params); setActionResult(r); }
    catch { setActionResult({ success: false, message_en: 'Error', message_vi: 'Lỗi' }); }
    setBusy(false);
  };

  const selectJob = async (jobType: string) => {
    if (!onSelectJob) return;
    setBusy(true);
    setActionResult(null);
    try {
      await onSelectJob(jobType);
      setShowJobSelection(false);
      onClose();
    } catch (err: any) {
      setActionResult({ success: false, message_en: err.message || 'Error', message_vi: err.message || 'Lỗi' });
    }
    setBusy(false);
  };

  // Job options with requirements
  const jobOptions = [
    {
      type: 'job_research',
      icon: '🔬',
      name_en: 'Research/Lab Work',
      name_vi: 'Nghiên cứu/Phòng thí nghiệm',
      salary_en: '$100-120/year',
      salary_vi: '$100-120/năm',
      requires_en: 'Graduate degree',
      requires_vi: 'Bằng thạc sĩ/tiến sĩ',
      benefits_en: 'High salary, Pension (8% deducted)',
      benefits_vi: 'Lương cao, Lương hưu (trừ 8%)',
      available: !!flags.has_grad_degree,
    },
    {
      type: 'job_industry_high',
      icon: '⚙️',
      name_en: 'Heavy Industry (High)',
      name_vi: 'Công nghiệp nặng (Cao cấp)',
      salary_en: '$130-150/year',
      salary_vi: '$130-150/năm',
      requires_en: 'Graduate degree',
      requires_vi: 'Bằng thạc sĩ/tiến sĩ',
      benefits_en: 'Highest salary, Pension (8% deducted)',
      benefits_vi: 'Lương cao nhất, Lương hưu (trừ 8%)',
      drawbacks_en: 'Health -1 to -2/year, Happiness -1 to -3/year',
      drawbacks_vi: 'Sức khỏe -1 đến -2/năm, Hạnh phúc -1 đến -3/năm',
      available: !!flags.has_grad_degree,
    },
    {
      type: 'job_industry_mid',
      icon: '🏭',
      name_en: 'Industry (Mid-level)',
      name_vi: 'Công nghiệp (Trung cấp)',
      salary_en: '$100-120/year',
      salary_vi: '$100-120/năm',
      requires_en: 'University degree',
      requires_vi: 'Bằng đại học',
      benefits_en: 'High salary, Pension (8% deducted)',
      benefits_vi: 'Lương cao, Lương hưu (trừ 8%)',
      drawbacks_en: 'Health -1 to -2/year, Happiness -1 to -3/year',
      drawbacks_vi: 'Sức khỏe -1 đến -2/năm, Hạnh phúc -1 đến -3/năm',
      available: !!flags.has_degree,
    },
    {
      type: 'job_office',
      icon: '💼',
      name_en: 'Office/Corporate Work',
      name_vi: 'Văn phòng/Công ty',
      salary_en: '$70-90/year',
      salary_vi: '$70-90/năm',
      requires_en: 'University degree',
      requires_vi: 'Bằng đại học',
      benefits_en: 'Stable, Pension (8% deducted)',
      benefits_vi: 'Ổn định, Lương hưu (trừ 8%)',
      drawbacks_en: 'Happiness -1/year',
      drawbacks_vi: 'Hạnh phúc -1/năm',
      available: !!flags.has_degree,
    },
    {
      type: 'job_manual',
      icon: '🏗️',
      name_en: 'Manual Labor',
      name_vi: 'Lao động chân tay',
      salary_en: '$65-85/year',
      salary_vi: '$65-85/năm',
      requires_en: 'None',
      requires_vi: 'Không yêu cầu',
      benefits_en: 'Good pay, Pension (8% deducted)',
      benefits_vi: 'Lương tốt, Lương hưu (trừ 8%)',
      drawbacks_en: 'Health -1 to -3/year',
      drawbacks_vi: 'Sức khỏe -1 đến -3/năm',
      available: true,
    },
    {
      type: 'job_service',
      icon: '🏪',
      name_en: 'Service Industry',
      name_vi: 'Ngành dịch vụ',
      salary_en: '$25-45/year',
      salary_vi: '$25-45/năm',
      requires_en: 'None',
      requires_vi: 'Không yêu cầu',
      benefits_en: 'Pension (8% deducted)',
      benefits_vi: 'Lương hưu (trừ 8%)',
      available: true,
    },
    {
      type: 'job_retail',
      icon: '🛒',
      name_en: 'Retail Worker',
      name_vi: 'Nhân viên bán lẻ',
      salary_en: '$35-55/year',
      salary_vi: '$35-55/năm',
      requires_en: 'None',
      requires_vi: 'Không yêu cầu',
      benefits_en: 'Pension (8% deducted)',
      benefits_vi: 'Lương hưu (trừ 8%)',
      drawbacks_en: 'Happiness -1 to -5/year',
      drawbacks_vi: 'Hạnh phúc -1 đến -5/năm',
      available: true,
    },
    {
      type: 'job_business',
      icon: '💰',
      name_en: 'Freelance Trading',
      name_vi: 'Thương nhân tự do',
      salary_en: '$20-100/year',
      salary_vi: '$20-100/năm',
      requires_en: 'None',
      requires_vi: 'Không yêu cầu',
      benefits_en: 'Higher pay, Freedom',
      benefits_vi: 'Lương cao hơn, Tự do',
      drawbacks_en: 'Very unstable, No pension, No seniority pay',
      drawbacks_vi: 'Rất không ổn định, Không lương hưu, Không tăng lương thâm niên',
      available: true,
    },
  ];

  if (showJobSelection) {
    return (
      <PopupOverlay title={`💼 ${lang === 'vi' ? 'Chọn Nghề Nghiệp' : 'Choose Career'}`} onClose={() => setShowJobSelection(false)}>
        <div className="job-selection-grid">
          {jobOptions.map((job) => (
            <button
              key={job.type}
              className={`job-card ${!job.available ? 'job-card--locked' : ''}`}
              onClick={() => job.available && selectJob(job.type)}
              disabled={!job.available || busy}
            >
              <div className="job-card__icon">{job.icon}</div>
              <div className="job-card__name">{lang === 'vi' ? job.name_vi : job.name_en}</div>
              <div className="job-card__salary">{lang === 'vi' ? job.salary_vi : job.salary_en}</div>
              <div className="job-card__requires">
                <span className="job-card__label">{lang === 'vi' ? 'Yêu cầu:' : 'Requires:'}</span>
                <span>{lang === 'vi' ? job.requires_vi : job.requires_en}</span>
              </div>
              <div className="job-card__benefits">
                <span className="job-card__label">✓</span>
                <span>{lang === 'vi' ? job.benefits_vi : job.benefits_en}</span>
              </div>
              {job.drawbacks_en && (
                <div className="job-card__drawbacks">
                  <span className="job-card__label">⚠</span>
                  <span>{lang === 'vi' ? job.drawbacks_vi : job.drawbacks_en}</span>
                </div>
              )}
              {!job.available && <div className="job-card__lock">🔒</div>}
            </button>
          ))}
        </div>
        {actionResult && <ActionResultBanner result={actionResult} lang={lang} />}
      </PopupOverlay>
    );
  }

  return (
    <PopupOverlay title={`💼 ${t.jobTitle}`} onClose={onClose}>
      {hasJob ? (<>
        <div className="popup-row"><span className="popup-row__label">📋 {t.jobName}</span><span className="popup-row__value">{lang === 'vi' ? (job.title_vi || job.title_en) : job.title_en}</span></div>
        <div className="popup-row"><span className="popup-row__label">💰 {t.jobSalary}</span><span className="popup-row__value">{flags.job_business ? `${formatMoney(20)}-${formatMoney(100)}` : formatMoney(job.salary || 0)}/{lang === 'vi' ? 'năm' : 'year'}</span></div>
        <div className="popup-row"><span className="popup-row__label">🏅 {t.jobPosition}</span><span className="popup-row__value">{lang === 'vi' ? (job.position_vi || job.position_en) : job.position_en}</span></div>

        {/* Years in current job */}
        {flags.years_in_current_job !== undefined && (
          <div className="popup-row">
            <span className="popup-row__label">📅 {lang === 'vi' ? 'Thâm niên' : 'Years in Job'}</span>
            <span className="popup-row__value">{flags.years_in_current_job} {lang === 'vi' ? 'năm' : 'years'}</span>
          </div>
        )}

        {/* Pension info */}
        {flags.pension_years !== undefined && (
          <>
            <div className="popup-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px' }}>
              <span className="popup-row__label" style={{ fontWeight: 'bold' }}>🏦 {lang === 'vi' ? 'Số năm đóng lương hưu' : 'Pension Contribution Years'}</span>
              <span className="popup-row__value" style={{ fontWeight: 'bold', color: flags.pension_years >= 15 ? '#22c55e' : '#fbbf24' }}>{flags.pension_years} {lang === 'vi' ? 'năm' : 'years'}</span>
            </div>
            <div className="popup-row">
              <span className="popup-row__label">💵 {lang === 'vi' ? 'Tổng đóng góp' : 'Total Contributions'}</span>
              <span className="popup-row__value">{formatMoney(flags.pension_total || 0)}</span>
            </div>
            {flags.pension_years >= 15 && (
              <div className="popup-row">
                <span className="popup-row__label">✅ {lang === 'vi' ? 'Trạng thái' : 'Status'}</span>
                <span className="popup-row__value" style={{ color: '#22c55e' }}>{lang === 'vi' ? 'Đủ điều kiện lương hưu' : 'Pension eligible'}</span>
              </div>
            )}
          </>
        )}
      </>) : (
        <div className="popup-empty">
          <span className="popup-empty__icon">🔍</span>
          <span className="popup-empty__text">{canFindJob ? (lang === 'vi' ? 'Bạn chưa có việc làm' : 'You are unemployed') : (lang === 'vi' ? 'Chưa đủ tuổi làm việc' : 'Not old enough to work')}</span>
        </div>
      )}
      {actionResult && <ActionResultBanner result={actionResult} lang={lang} />}

      <div className="popup-actions">
        {isEmployed && character.age < 55 && (
          <button className="popup-action-btn popup-action-btn--danger" onClick={() => doAction('quit_job')} disabled={busy}>🚪 {lang === 'vi' ? 'Nghỉ việc' : 'Quit job'}</button>
        )}
        {!isEmployed && canFindJob && character.age < 55 && onSelectJob && (
          <button className="popup-action-btn popup-action-btn--primary" onClick={() => setShowJobSelection(true)} disabled={busy}>🔍 {lang === 'vi' ? 'Tìm việc làm' : 'Find a job'}</button>
        )}
        {flags.pension_total > 0 && flags.pension_years < 15 && (
          <button className="popup-action-btn" onClick={() => doAction('withdraw_pension_lump_sum')} disabled={busy}>
            💰 {lang === 'vi' ? 'Rút lương hưu (90%)' : 'Withdraw pension (90%)'}
          </button>
        )}
      </div>
    </PopupOverlay>
  );
}

/* ===== COMPONENT: AssetPopup (view + buy/sell) ===== */
function AssetPopup({ character, onClose, onAction }: { character: Character; onClose: () => void; onAction: (a: string) => Promise<ActionResult> }) {
  const { t, lang } = useI18n();
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const assets = character.assets;
  const hasAny = (assets && (assets.house || assets.car || assets.insurance || assets.stocks || assets.business || assets.education_fund || (assets.luxury_items && assets.luxury_items.length > 0))) || !!character.flags?.insurance_expires_at;
  const doAction = async (type: string, params?: any) => {
    setBusy(true); setActionResult(null);
    try { const r = await onAction(type, params); setActionResult(r); }
    catch { setActionResult({ success: false, message_en: 'Error', message_vi: 'Lỗi' }); }
    setBusy(false);
  };
  return (
    <PopupOverlay title={`🏠 ${t.assetTitle}`} onClose={onClose}>
      {hasAny ? (<>
        {assets.house && (
          <div className="popup-row">
            <span className="popup-row__label">🏠 {t.assetHouse}</span>
            <div className="popup-row__info">
              <span className="popup-row__name">{assets.house.name}</span>
              <span className="popup-row__detail">
                {t.assetValue}: {formatMoney(assets.house.value)}
              </span>
            </div>
          </div>
        )}
        {assets.car && (<div className="popup-row"><span className="popup-row__label">🚗 {t.assetCar}</span><div className="popup-row__info"><span className="popup-row__name">{assets.car.name}</span><span className="popup-row__detail">{t.assetValue}: {formatMoney(assets.car.value)}</span></div></div>)}
        {assets.stocks && (<div className="popup-row"><span className="popup-row__label">📈 {lang === 'vi' ? 'Cổ phiếu' : 'Stocks'}</span><div className="popup-row__info"><span className="popup-row__name">{lang === 'vi' ? assets.stocks.name_vi : assets.stocks.name}</span><span className="popup-row__detail">{t.assetValue}: {formatMoney(assets.stocks.value)}</span></div></div>)}
        {assets.business && (<div className="popup-row"><span className="popup-row__label">🏢 {lang === 'vi' ? 'Doanh nghiệp' : 'Business'}</span><div className="popup-row__info"><span className="popup-row__name">{assets.business.name}</span><span className="popup-row__detail">{t.assetValue}: {formatMoney(assets.business.value)} • {lang === 'vi' ? 'Thu nhập' : 'Income'}: ~{formatMoney(Math.round(assets.business.value * 0.025))}/yr</span></div></div>)}
        {assets.education_fund && (<div className="popup-row"><span className="popup-row__label">🎓 {lang === 'vi' ? 'Quỹ học vấn' : 'Education Fund'}</span><div className="popup-row__info"><span className="popup-row__name">{lang === 'vi' ? assets.education_fund.name_vi : assets.education_fund.name}</span><span className="popup-row__detail">{t.assetValue}: {formatMoney(assets.education_fund.value)}</span></div></div>)}
        {assets.luxury_items && assets.luxury_items.length > 0 && (
          <div className="popup-row">
            <span className="popup-row__label">💎 {lang === 'vi' ? 'Đồ xa xỉ' : 'Luxury Items'}</span>
            <div className="popup-row__list">
              {assets.luxury_items.map((item: any, i: number) => (
                <div key={i} className="popup-row__info">
                  <span className="popup-row__name">{item.name}</span>
                  <span className="popup-row__detail">{formatMoney(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {character.flags?.insurance_expires_at && (
          <div className="popup-row">
            <span className="popup-row__label">🛡️ {lang === 'vi' ? 'Bảo hiểm sức khỏe' : 'Health Insurance'}</span>
            <span className="popup-row__value" style={{ color: character.flags.insurance_expires_at > character.age ? '#22c55e' : '#ef4444' }}>
              {character.flags.insurance_expires_at > character.age
                ? `${lang === 'vi' ? 'Còn hiệu lực đến' : 'Valid until'} ${character.flags.insurance_expires_at} ${lang === 'vi' ? 'tuổi' : 'y/o'}`
                : `${lang === 'vi' ? 'Đã hết hạn' : 'Expired'}`}
            </span>
          </div>
        )}
      </>) : (<div className="popup-empty"><span className="popup-empty__icon">📦</span><span className="popup-empty__text">{lang === 'vi' ? 'Chưa có tài sản. Mua ngay!' : 'No assets. Buy now!'}</span></div>)}
      {actionResult && <ActionResultBanner result={actionResult} lang={lang} />}

      <div className="popup-actions">
        {/* Buy actions */}
        {!assets?.house && (<button className="popup-action-btn" onClick={() => doAction('buy_house')} disabled={busy}>🏠 {lang === 'vi' ? 'Mua nhà ($500)' : 'Buy house ($500)'}</button>)}
        {!assets?.car && (<button className="popup-action-btn" onClick={() => doAction('buy_car')} disabled={busy}>🚗 {lang === 'vi' ? 'Mua xe ($200)' : 'Buy car ($200)'}</button>)}
        {!assets?.stocks && (<button className="popup-action-btn" onClick={() => doAction('buy_stocks')} disabled={busy}>📈 {lang === 'vi' ? 'Mua cổ phiếu ($150)' : 'Buy stocks ($150)'}</button>)}
        {!assets?.business && (<button className="popup-action-btn" onClick={() => doAction('buy_business')} disabled={busy}>🏢 {lang === 'vi' ? 'Mua doanh nghiệp ($800)' : 'Buy business ($800)'}</button>)}
        {!assets?.education_fund && character.flags?.has_child && (<button className="popup-action-btn" onClick={() => doAction('buy_education_fund')} disabled={busy}>🎓 {lang === 'vi' ? 'Quỹ học vấn ($200)' : 'Education fund ($200)'}</button>)}
        {!character.flags?.insurance_expires_at && (<button className="popup-action-btn" onClick={() => doAction('buy_insurance')} disabled={busy}>🛡️ {lang === 'vi' ? 'Mua bảo hiểm ($60)' : 'Buy insurance ($60)'}</button>)}
        {character.flags?.insurance_expires_at && (
          <button className="popup-action-btn" onClick={() => doAction('buy_insurance')} disabled={busy}>
            🛡️ {lang === 'vi' ? 'Gia hạn bảo hiểm ($60)' : 'Renew insurance ($60)'}
          </button>
        )}
        <button className="popup-action-btn" onClick={() => doAction('buy_luxury')} disabled={busy}>💎 {lang === 'vi' ? 'Mua đồ xa xỉ ($100)' : 'Buy luxury ($100)'}</button>

        {/* Sell actions */}
        {assets?.house && (<button className="popup-action-btn popup-action-btn--danger" onClick={() => doAction('sell_house')} disabled={busy}>🏠 {lang === 'vi' ? 'Bán nhà' : 'Sell house'} <span className="popup-action-cost">85-90%</span></button>)}
        {assets?.car && (<button className="popup-action-btn popup-action-btn--danger" onClick={() => doAction('sell_car')} disabled={busy}>🚗 {lang === 'vi' ? 'Bán xe' : 'Sell car'} <span className="popup-action-cost">50-80%</span></button>)}
        {assets?.stocks && (<button className="popup-action-btn popup-action-btn--danger" onClick={() => doAction('sell_stocks')} disabled={busy}>📈 {lang === 'vi' ? 'Bán cổ phiếu' : 'Sell stocks'} <span className="popup-action-cost">70-130%</span></button>)}
        {assets?.business && (<button className="popup-action-btn popup-action-btn--danger" onClick={() => doAction('sell_business')} disabled={busy}>🏢 {lang === 'vi' ? 'Bán doanh nghiệp' : 'Sell business'} <span className="popup-action-cost">80-120%</span></button>)}
      </div>
    </PopupOverlay>
  );
}


/* ================================================================
   TURN SUMMARY POPUP — Shows annual stat changes after Next Year
   ================================================================ */
function TurnSummaryPopup({ summary, onDismiss }: { summary: TurnSummaryItem[]; onDismiss: () => void }) {
  const { lang } = useI18n();
  const statIcons: Record<string, string> = { health: '❤️', money: '💰', happiness: '😊' };
  return (
    <div className="popup-overlay" onClick={onDismiss}>
      <div className="event-popup turn-summary-popup" onClick={(e) => e.stopPropagation()}>
        <div className="event-popup__header">
          <span className="event-popup__age">📊 {lang === 'vi' ? 'Tổng kết năm' : 'Year Summary'}</span>
        </div>
        <div className="turn-summary__list">
          {summary.map((item, i) => (
            <div key={i} className={`turn-summary__item ${item.value >= 0 ? 'turn-summary__item--pos' : 'turn-summary__item--neg'}`}>
              <span className="turn-summary__icon">{statIcons[item.stat] || '📊'}</span>
              <span className="turn-summary__msg">{lang === 'vi' ? item.message_vi : item.message_en}</span>
              <span className={`turn-summary__val ${item.value >= 0 ? 'stat-change-sm--pos' : 'stat-change-sm--neg'}`}>
                {item.value >= 0 ? '+' : ''}{item.stat === 'money' ? formatMoney(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
        <button className="event-popup__dismiss-btn" onClick={onDismiss}>
          {lang === 'vi' ? '✓ Tiếp tục' : '✓ Continue'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   EVENT POPUP — Shows one event at a time as a modal overlay
   ================================================================ */
function EventPopup({
  event, character, onSelectChoice, loading,
}: {
  event: GameEvent; character: Character;
  onSelectChoice: (choiceId: number) => void; loading: boolean;
}) {
  const { t, lang } = useI18n();
  return (
    <div className="popup-overlay">
      <div className="event-popup" onClick={(e) => e.stopPropagation()}>
        <div className="event-popup__header">
          <span className="event-popup__age">🎂 {lang === 'vi' ? `Tuổi ${character.age}` : `Age ${character.age}`}</span>
          <div className="event-popup__stats">
            <span className="event-popup__stat">💰 {formatMoney(character.money)}</span>
            <span className="event-popup__stat">❤️ {character.health}</span>
            <span className="event-popup__stat">😊 {character.happiness}</span>
          </div>
        </div>
        <h2 className="event-popup__title">{tc(event.title_en, event.title_vi, lang)}</h2>
        <p className="event-popup__desc">{tc(event.description_en, event.description_vi, lang)}</p>
        <div className="event-popup__divider" />
        <div className="event-popup__choices">
          <span className="event-popup__choices-label">{t.yourChoices}</span>
          {event.choices.map((choice, index) => {
            const available = isChoiceAvailable(choice, character);
            return (
              <button key={choice.id} className="choice-btn" onClick={() => onSelectChoice(choice.id)} disabled={!available || loading} id={`choice-${choice.id}`}>
                <span className="choice-btn__number">{index + 1}</span>
                <span className="choice-btn__text">{tc(choice.content_en, choice.content_vi, lang)}</span>
                {!available && <span className="choice-btn__locked">{t.locked}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   OUTCOME POPUP — Shows the result of a choice
   ================================================================ */
function OutcomePopup({
  result, onDismiss,
}: {
  result: SelectResult; onDismiss: () => void;
}) {
  const { t, lang } = useI18n();
  const statLabels: Record<string, { icon: string; label: string }> = {
    health: { icon: '❤️', label: t.statHealth },
    money: { icon: '💰', label: t.statMoney },
    happiness: { icon: '😊', label: t.statHappiness },
  };

  return (
    <div className="popup-overlay">
      <div className="outcome-popup" onClick={(e) => e.stopPropagation()}>
        <div className="outcome-popup__dice">
          {result.outcome.set_flags?.has_grad_degree ? '🎓' : result.outcome.set_flags?.has_degree ? '🎓' : '🎲'}
        </div>
        <div className="outcome-popup__roll">{result.roll}</div>
        <div className="outcome-popup__roll-label">{t.diceResult}</div>
        <p className="outcome-popup__message">{tc(result.outcome.message_en, result.outcome.message_vi, lang)}</p>

        {result.outcome.stat_changes && (
          <div className="outcome-popup__changes">
            {Object.entries(result.outcome.stat_changes).map(([stat, change]) => (
              <span key={stat} className={`stat-change ${change > 0 ? 'stat-change--positive' : 'stat-change--negative'}`}>
                {statLabels[stat]?.icon || '📊'} {change > 0 ? '+' : ''}{stat === 'money' ? formatMoney(change) : change}
              </span>
            ))}
          </div>
        )}

        <button className="outcome-popup__btn" onClick={onDismiss} id="outcome-dismiss-btn">
          {result.game_over ? t.viewResults : t.continueBtn}
        </button>
      </div>
    </div>
  );
}

/* ===== COMPONENT: Timeline Entry (past, compact) ===== */
function TimelineEntryView({ entry }: { entry: TimelineEntry }) {
  const { lang } = useI18n();
  const statIcons: Record<string, string> = { health: '❤️', money: '💰', happiness: '😊' };

  return (
    <div className="timeline-entry timeline-entry--past">
      <div className="timeline-entry__age">
        <span className="timeline-entry__age-num">{entry.age}</span>
        <span className="timeline-entry__age-label">{lang === 'vi' ? 'tuổi' : 'y/o'}</span>
      </div>
      <div className="timeline-entry__content">
        {entry.peaceful && (
          <div className="timeline-entry__peaceful">🌤️ {lang === 'vi' ? 'Một năm bình yên...' : 'A peaceful year...'}</div>
        )}
        {entry.events.map((re, i) => (
          <div key={i} className="timeline-event">
            <div className="timeline-event__title">{tc(re.event.title_en, re.event.title_vi, lang)}</div>
            <div className="timeline-event__outcome">
              <span className="timeline-event__dice">🎲 {re.result.roll}</span>
              <span className="timeline-event__msg">{tc(re.result.outcome.message_en, re.result.outcome.message_vi, lang)}</span>
              {re.result.outcome.stat_changes && (
                <div className="timeline-event__changes">
                  {Object.entries(re.result.outcome.stat_changes).map(([stat, change]) => (
                    <span key={stat} className={`stat-change-sm ${change > 0 ? 'stat-change-sm--pos' : 'stat-change-sm--neg'}`}>
                      {statIcons[stat] || '📊'} {change > 0 ? '+' : ''}{stat === 'money' ? formatMoney(change) : change}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {entry.summary.length > 0 && (
          <div className="timeline-entry__summary">
            {entry.summary.map((item, i) => (
              <span key={i} className={`stat-change-sm ${item.value >= 0 ? 'stat-change-sm--pos' : 'stat-change-sm--neg'}`}>
                {statIcons[item.stat] || '📌'} {item.value >= 0 ? '+' : ''}{item.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== COMPONENT: GameOverScreen ===== */
function GameOverScreen({ character, onRestart }: { character: Character; onRestart: () => void }) {
  const { t } = useI18n();
  const isDeath = character.health <= 0;
  const isBankrupt = character.money < 0;
  const isDepressed = character.happiness <= 0;
  let emoji = '🎉'; let title = t.retirementTitle; let subtitle = t.retirementSubtitle(character.age);
  if (isDeath) { emoji = '💀'; title = t.deathTitle; subtitle = t.deathSubtitle(character.age); }
  else if (isBankrupt) { emoji = '💸'; title = t.bankruptTitle; subtitle = t.bankruptSubtitle(character.age); }
  else if (isDepressed) { emoji = '🌧️'; title = t.depressedTitle; subtitle = t.depressedSubtitle(character.age); }

  return (
    <div className="gameover-screen">
      <div className="gameover-screen__emoji">{emoji}</div>
      <h1 className="gameover-screen__title">{title}</h1>
      <p className="gameover-screen__subtitle">{subtitle}</p>
      <div className="gameover-screen__stats">
        <div className="gameover-stat"><div className="gameover-stat__label">{t.statAge}</div><div className="gameover-stat__value">🎂 {character.age}</div></div>
        <div className="gameover-stat"><div className="gameover-stat__label">{t.statMoney}</div><div className="gameover-stat__value">💰 {formatMoney(character.money)}</div></div>
        <div className="gameover-stat"><div className="gameover-stat__label">{t.statHealth}</div><div className="gameover-stat__value">❤️ {character.health}</div></div>
        <div className="gameover-stat"><div className="gameover-stat__label">{t.statHappiness}</div><div className="gameover-stat__value">😊 {character.happiness}</div></div>
      </div>
      <p className="gameover-screen__name">{character.name}</p>
      <button className="gameover-screen__btn" onClick={onRestart} id="restart-btn">{t.playAgain}</button>
    </div>
  );
}

/* ==========================================================
   MAIN APP — Popup-driven event flow
   ========================================================== */
function App() {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<GamePhase>('start');
  const [character, setCharacter] = useState<Character | null>(null);

  // Timeline: accumulated history of ALL past ages
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  // Current age events & popup state
  const [currentEvents, setCurrentEvents] = useState<GameEvent[]>([]);
  const [resolvedThisTurn, setResolvedThisTurn] = useState<ResolvedEvent[]>([]);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [currentResult, setCurrentResult] = useState<SelectResult | null>(null); // outcome being shown
  const [pendingGameOver, setPendingGameOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<TurnSummaryItem[] | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  // Auto-scroll feed to bottom
  const feedEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedEndRef.current) feedEndRef.current.scrollTop = feedEndRef.current.scrollHeight;
  }, [timeline]);

  const clearError = () => setError(null);
  const checkGameOver = (char: Character): boolean => char.health <= 0 || char.money < 0 || char.happiness <= 0 || char.age >= 80;

  // Load events for character's current age
  const loadEvents = useCallback(async (char: Character) => {
    try {
      const events = await api.getEvents(char.id);
      setCurrentEvents(events);
      setResolvedThisTurn([]);
      setActiveEventIndex(0);
      setCurrentResult(null);
    } catch {
      setCurrentEvents([]);
      setResolvedThisTurn([]);
      setActiveEventIndex(0);
    }
  }, []);

  const handleGoToCreate = useCallback(() => setPhase('create_character'), []);

  const handleCreateCharacter = useCallback(async (params: CreateCharacterParams) => {
    try {
      setLoading(true); clearError();
      const newCharacter = await api.createCharacter(params);
      setCharacter(newCharacter);
      setTimeline([]);
      await loadEvents(newCharacter);
      setPhase('event');
    } catch (err: any) { setError(err.message || t.errorStart); }
    finally { setLoading(false); }
  }, [t, loadEvents]);

  // Player picks a choice in the event popup → call API → show outcome popup
  const handleSelectChoice = useCallback(async (choiceId: number) => {
    if (!character) return;
    try {
      setLoading(true); clearError();
      const selectResult = await api.selectChoice(choiceId, character.id);
      setCharacter(selectResult.character);
      setCurrentResult(selectResult);
      if (selectResult.game_over) setPendingGameOver(true);
    } catch (err: any) { setError(err.message || t.errorChoice); }
    finally { setLoading(false); }
  }, [character, t]);

  // Player dismisses the outcome popup → save to resolved, show next event or return to timeline
  const handleDismissOutcome = useCallback(() => {
    if (!currentResult) return;
    const event = currentEvents[activeEventIndex];
    if (event) {
      setResolvedThisTurn(prev => [...prev, { event, result: currentResult }]);
    }
    setCurrentResult(null);

    if (pendingGameOver) {
      // Archive this turn first, then game over
      setTimeline(prev => [...prev, {
        age: character!.age,
        events: [...resolvedThisTurn, { event: event!, result: currentResult }],
        summary: [],
        peaceful: false,
      }]);
      setPhase('gameover');
      setPendingGameOver(false);
      return;
    }

    // Move to next event if any
    const nextIndex = activeEventIndex + 1;
    if (nextIndex < currentEvents.length) {
      setActiveEventIndex(nextIndex);
    } else {
      setActiveEventIndex(-1); // all events done, show timeline
    }
  }, [currentResult, currentEvents, activeEventIndex, pendingGameOver, character, resolvedThisTurn]);

  // Next Year: archive, advance age, load new events
  const handleNextYear = useCallback(async () => {
    if (!character) return;
    try {
      setLoading(true); clearError();
      const response = await api.updateCharacter(character.id, { age: character.age + 1 } as any);
      const updatedCharacter = response.character;
      const summary = response.turn_summary || [];

      // Archive current age
      setTimeline(prev => [...prev, {
        age: character.age,
        events: resolvedThisTurn,
        summary: summary,
        peaceful: currentEvents.length === 0 && resolvedThisTurn.length === 0,
      }]);

      setCharacter(updatedCharacter);

      if (checkGameOver(updatedCharacter)) {
        setPhase('gameover');
        return;
      }

      // Show turn summary popup if there are items
      if (summary.length > 0) {
        setPendingSummary(summary);
      } else {
        await loadEvents(updatedCharacter);
      }
    } catch (err: any) { setError(err.message || t.errorContinue); }
    finally { setLoading(false); }
  }, [character, currentEvents, resolvedThisTurn, t, loadEvents]);

  // Dismiss turn summary and load next events
  const handleDismissSummary = useCallback(async () => {
    setPendingSummary(null);
    if (character) await loadEvents(character);
  }, [character, loadEvents]);

  const handleRestart = useCallback(() => {
    setPhase('start'); setCharacter(null); setTimeline([]); setCurrentEvents([]);
    setResolvedThisTurn([]); setActiveEventIndex(0); setCurrentResult(null);
    setError(null); setActivePopup(null); setPendingGameOver(false); setPendingSummary(null);
  }, []);

  // Are all events for this age done?
  const allEventsDone = activeEventIndex === -1 || currentEvents.length === 0;

  // The event currently being shown in popup (if any)
  const popupEvent = (!allEventsDone && !currentResult && activeEventIndex >= 0 && activeEventIndex < currentEvents.length)
    ? currentEvents[activeEventIndex] : null;

  return (
    <>
      <LangSwitcher />
      {error && (<div className="container" style={{ paddingTop: 16 }}><div className="error-banner">⚠️ {error}</div></div>)}

      {phase === 'start' && <StartScreen onStart={handleGoToCreate} />}
      {phase === 'create_character' && <CreateCharacterScreen onCreated={handleCreateCharacter} loading={loading} />}

      {/* ===== MAIN GAME SCREEN ===== */}
      {phase === 'event' && character && (
        <div className="game-screen">
          <div className="game-screen__top">
            <CharacterHeader character={character} />
            <ActionButtons onOpen={setActivePopup} />
          </div>

          <div className="game-screen__feed" ref={feedEndRef}>
            <div className="timeline-feed">
              {timeline.map((entry, i) => <TimelineEntryView key={i} entry={entry} />)}

              {/* Current age marker */}
              <div className="timeline-entry timeline-entry--current">
                <div className="timeline-entry__age timeline-entry__age--current">
                  <span className="timeline-entry__age-num">{character.age}</span>
                  <span className="timeline-entry__age-label">{lang === 'vi' ? 'tuổi' : 'y/o'}</span>
                </div>
                <div className="timeline-entry__content">
                  {/* Show already-resolved events for this turn */}
                  {resolvedThisTurn.map((re, i) => (
                    <div key={i} className="timeline-event">
                      <div className="timeline-event__title">{tc(re.event.title_en, re.event.title_vi, lang)}</div>
                      <div className="timeline-event__outcome">
                        <span className="timeline-event__dice">🎲 {re.result.roll}</span>
                        <span className="timeline-event__msg">{tc(re.result.outcome.message_en, re.result.outcome.message_vi, lang)}</span>
                      </div>
                    </div>
                  ))}
                  {/* Family introduction at age 0 or peaceful year */}
                  {allEventsDone && resolvedThisTurn.length === 0 && currentEvents.length === 0 && (
                    character.age === 0 ? (
                      <div className="timeline-entry__family-intro">
                        <div className="family-intro__title">👨‍👩‍👦 {lang === 'vi' ? 'Gia Đình Của Bạn' : 'Your Family'}</div>
                        <div className="family-intro__members">
                          {character.family?.father && (
                            <div className="family-intro__member">
                              <span className="family-intro__label">👨 {lang === 'vi' ? 'Cha:' : 'Father:'}</span>
                              <span className="family-intro__name">{character.family.father.name}</span>
                            </div>
                          )}
                          {character.family?.mother && (
                            <div className="family-intro__member">
                              <span className="family-intro__label">👩 {lang === 'vi' ? 'Mẹ:' : 'Mother:'}</span>
                              <span className="family-intro__name">{character.family.mother.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="family-intro__background">
                          {character.background === 'poor' && (
                            <>
                              <span className="family-intro__bg-icon">🏚️</span>
                              <span className="family-intro__bg-text">{lang === 'vi' ? 'Xuất thân nghèo khó' : 'Poor background'}</span>
                            </>
                          )}
                          {character.background === 'middle' && (
                            <>
                              <span className="family-intro__bg-icon">🏡</span>
                              <span className="family-intro__bg-text">{lang === 'vi' ? 'Xuất thân trung lưu' : 'Middle-class background'}</span>
                            </>
                          )}
                          {character.background === 'rich' && (
                            <>
                              <span className="family-intro__bg-icon">🏰</span>
                              <span className="family-intro__bg-text">{lang === 'vi' ? 'Xuất thân giàu có' : 'Wealthy background'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="timeline-entry__peaceful">🌤️ {lang === 'vi' ? 'Một năm bình yên...' : 'A peaceful year...'}</div>
                    )
                  )}
                  {/* Remaining events indicator */}
                  {!allEventsDone && (
                    <div className="timeline-entry__pending">
                      📋 {lang === 'vi'
                        ? `Còn ${currentEvents.length - activeEventIndex} sự kiện...`
                        : `${currentEvents.length - activeEventIndex} event(s) remaining...`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="game-screen__bottom">
            <button
              className={`next-year-btn ${allEventsDone ? 'next-year-btn--ready' : ''}`}
              onClick={handleNextYear}
              disabled={!allEventsDone || loading}
              id="next-year-btn"
            >
              {loading ? (lang === 'vi' ? 'Đang xử lý...' : 'Processing...') :
                allEventsDone
                  ? (lang === 'vi' ? '⏩ Năm tiếp theo' : '⏩ Next Year')
                  : (lang === 'vi' ? '📝 Đang giải quyết sự kiện...' : '📝 Resolving events...')}
            </button>
          </div>

          {/* EVENT POPUP — shows one event at a time */}
          {popupEvent && character && (
            <EventPopup
              event={popupEvent}
              character={character}
              onSelectChoice={handleSelectChoice}
              loading={loading}
            />
          )}

          {/* OUTCOME POPUP — shows dice result after choice */}
          {currentResult && (
            <OutcomePopup result={currentResult} onDismiss={handleDismissOutcome} />
          )}
          {/* TURN SUMMARY POPUP — shows after Next Year */}
          {pendingSummary && (
            <TurnSummaryPopup summary={pendingSummary} onDismiss={handleDismissSummary} />
          )}
        </div>
      )}

      {phase === 'gameover' && character && <GameOverScreen character={character} onRestart={handleRestart} />}

      {/* Info Popups */}
      {activePopup === 'relationships' && character && <RelationshipPopup character={character} onClose={() => setActivePopup(null)} onAction={async (actionType, params) => {
        const res = await api.performAction(character.id, actionType, params);
        setCharacter(res.character);
        return res.result;
      }} onShowResult={(result) => {
        setActionResult(result);
      }} />}
      {activePopup === 'job' && character && <JobPopup character={character} onClose={() => setActivePopup(null)} onAction={async (actionType) => {
        const res = await api.performAction(character.id, actionType);
        setCharacter(res.character);
        return res.result;
      }} onSelectJob={async (jobType) => {
        const res = await api.selectJob(character.id, jobType);
        setCharacter(res.character);
      }} />}
      {(activePopup === 'assets' || activePopup === 'actions') && character && <AssetPopup character={character} onClose={() => setActivePopup(null)} onAction={async (actionType) => {
        const res = await api.performAction(character.id, actionType);
        setCharacter(res.character);
        return res.result;
      }} />}
      {activePopup === 'health' && character && (
        <PopupOverlay title={`❤️ ${lang === 'vi' ? 'Chăm sóc sức khỏe' : 'Health Care'}`} onClose={() => setActivePopup(null)}>
          <div className="popup-empty">
            <span className="popup-empty__icon">🏥</span>
            <span className="popup-empty__text">{lang === 'vi' ? 'Chi tiền để cải thiện sức khỏe' : 'Spend money to improve health'}</span>
          </div>
          {actionResult && <ActionResultBanner result={actionResult} lang={lang} />}
          <div className="popup-actions">
            <button className="popup-action-btn" onClick={async () => {
              const res = await api.performAction(character.id, 'health_checkup');
              setCharacter(res.character);
              setActionResult(res.result);
              setActivePopup(null);
            }}>
              🏥 {lang === 'vi' ? 'Khám sức khỏe ($200)' : 'Health checkup ($200)'}
              <span className="popup-action-detail">{lang === 'vi' ? '+5-15 sức khỏe' : '+5-15 health'}</span>
            </button>
            <button className="popup-action-btn" onClick={async () => {
              const res = await api.performAction(character.id, 'gym_membership');
              setCharacter(res.character);
              setActionResult(res.result);
              setActivePopup(null);
            }}>
              💪 {lang === 'vi' ? 'Tập gym ($80)' : 'Gym membership ($80)'}
              <span className="popup-action-detail">{lang === 'vi' ? '+3-8 sức khỏe' : '+3-8 health'}</span>
            </button>
            <button className="popup-action-btn" onClick={async () => {
              const res = await api.performAction(character.id, 'healthy_diet');
              setCharacter(res.character);
              setActionResult(res.result);
              setActivePopup(null);
            }}>
              🥗 {lang === 'vi' ? 'Ăn uống lành mạnh ($50)' : 'Healthy diet ($50)'}
              <span className="popup-action-detail">{lang === 'vi' ? '+2-5 sức khỏe' : '+2-5 health'}</span>
            </button>
          </div>
        </PopupOverlay>
      )}

      {/* Health Action Result Popup */}
      {actionResult && !activePopup && (
        <div className="popup-overlay">
          <div className="outcome-popup" onClick={(e) => e.stopPropagation()}>
            <div className="outcome-popup__dice">{actionResult.message_en?.includes('married') ? '💍' : '❤️'}</div>
            <p className="outcome-popup__message">{lang === 'vi' ? actionResult.message_vi : actionResult.message_en}</p>
            {actionResult.stat_changes && (
              <div className="outcome-popup__changes">
                {Object.entries(actionResult.stat_changes).map(([stat, change]) => (
                  <span key={stat} className={`stat-change ${change > 0 ? 'stat-change--positive' : 'stat-change--negative'}`}>
                    {stat === 'health' ? '❤️' : stat === 'money' ? '💰' : '😊'} {change > 0 ? '+' : ''}{stat === 'money' ? formatMoney(change) : change}
                  </span>
                ))}
              </div>
            )}
            <button className="outcome-popup__btn" onClick={() => setActionResult(null)}>
              {lang === 'vi' ? 'Tiếp tục' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
