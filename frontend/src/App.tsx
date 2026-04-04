import { useState, useCallback } from 'react';
import './index.css';
import { api } from './api';
import { Character, Event as GameEvent, SelectResult, GamePhase, Choice, TurnSummaryItem } from './types';
import { useI18n, Lang } from './i18n';

/* ===== HELPER: Pick translated text from _en/_vi fields ===== */
function tc(en: string, vi: string | undefined, lang: Lang): string {
  return lang === 'vi' && vi ? vi : en;
}

/* ===== HELPER: Check if a choice is available ===== */
function isChoiceAvailable(choice: Choice, character: Character): boolean {
  if (!choice.display_conditions) return true;
  const conditions = choice.display_conditions;
  if (conditions.min_money !== undefined && character.money < conditions.min_money) return false;
  if (conditions.min_health !== undefined && character.health < conditions.min_health) return false;
  if (conditions.min_happiness !== undefined && character.happiness < conditions.min_happiness) return false;
  return true;
}

/* ===== HELPER: Format money ===== */
function formatMoney(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/* ===== COMPONENT: LangSwitcher ===== */
function LangSwitcher() {
  const { lang, toggleLang } = useI18n();
  return (
    <button className="lang-switcher" onClick={toggleLang} id="lang-switcher" title="Switch language">
      🌐 {lang.toUpperCase()}
    </button>
  );
}

/* ===== COMPONENT: StatsBar ===== */
function StatsBar({ character }: { character: Character }) {
  const { t } = useI18n();
  return (
    <div className="stats-bar">
      <div className="stat-item stat-item--age">
        <div className="stat-item__header">
          <span className="stat-item__label">
            <span className="stat-item__icon">🎂</span> {t.statAge}
          </span>
          <span className="stat-item__value">{character.age}</span>
        </div>
        <div className="stat-item__bar">
          <div
            className="stat-item__bar-fill"
            style={{ width: `${Math.min(character.age / 80 * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="stat-item stat-item--health">
        <div className="stat-item__header">
          <span className="stat-item__label">
            <span className="stat-item__icon">❤️</span> {t.statHealth}
          </span>
          <span className="stat-item__value">{character.health}</span>
        </div>
        <div className="stat-item__bar">
          <div
            className="stat-item__bar-fill"
            style={{ width: `${character.health}%` }}
          />
        </div>
      </div>

      <div className="stat-item stat-item--money">
        <div className="stat-item__header">
          <span className="stat-item__label">
            <span className="stat-item__icon">💰</span> {t.statMoney}
          </span>
          <span className="stat-item__value">{formatMoney(character.money)}</span>
        </div>
      </div>

      <div className="stat-item stat-item--happiness">
        <div className="stat-item__header">
          <span className="stat-item__label">
            <span className="stat-item__icon">😊</span> {t.statHappiness}
          </span>
          <span className="stat-item__value">{character.happiness}</span>
        </div>
        <div className="stat-item__bar">
          <div
            className="stat-item__bar-fill"
            style={{ width: `${character.happiness}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENT: StatusPanel ===== */
/* ===== Job Title Translations ===== */
const jobTitleViMap: Record<string, string> = {
  'Junior Analyst': 'Nhân viên Phân tích',
  'Technician': 'Kỹ thuật viên',
  'Consultant': 'Tư vấn viên',
  'Office Staff': 'Nhân viên Văn phòng',
  'Construction Worker': 'Công nhân Xây dựng',
  'Self-Employed': 'Tự kinh doanh',
  'Factory Worker': 'Công nhân Nhà máy',
  'Clerk': 'Nhân viên Bán hàng',
  'Street Food Vendor': 'Bán hàng rong',
  'Senior Analyst': 'Chuyên viên Phân tích',
  'Manager': 'Quản lý',
  'Researcher': 'Nghiên cứu viên',
};

function StatusPanel({ character }: { character: Character }) {
  const { lang } = useI18n();
  const flags = character.flags as Record<string, unknown> | undefined;
  if (!flags) return null;

  // Life stage label
  const age = character.age;
  const stageName =
    age < 18 ? (lang === 'vi' ? '🧒 Tuổi Thơ' : '🧒 Childhood') :
    age < 22 ? (lang === 'vi' ? '🎓 Đại Học' : '🎓 College') :
    age < 30 ? (lang === 'vi' ? '💼 Đi Làm' : '💼 Career') :
    age < 40 ? (lang === 'vi' ? '💑 Gia Đình' : '💑 Family') :
    age < 60 ? (lang === 'vi' ? '👨‍👩‍👦 Nuôi Con' : '👨‍👩‍👦 Parenting') :
    (lang === 'vi' ? '🏖️ Nghỉ Hưu' : '🏖️ Retirement');

  const isMarried = !!flags['is_married'];
  const childrenCount = Number(flags['children_count'] ?? 0);
  const jobTitle = flags['job_title'] as string | undefined;
  const isRetired = !!flags['is_retired'];

  // Translate job title
  const displayJobTitle = jobTitle
    ? (lang === 'vi' ? (jobTitleViMap[jobTitle] || jobTitle) : jobTitle)
    : undefined;

  const items = [];
  if (displayJobTitle && !isRetired) items.push(`💼 ${displayJobTitle}`);
  if (isRetired) items.push(lang === 'vi' ? '🏖️ Đã nghỉ hưu' : '🏖️ Retired');
  if (isMarried) items.push(lang === 'vi' ? '💍 Đã kết hôn' : '💍 Married');
  if (!isMarried && flags['is_single']) items.push(lang === 'vi' ? '🧍 Độc thân' : '🧍 Single');
  if (childrenCount > 0) items.push(`👶 ${childrenCount} ${lang === 'vi' ? 'con' : (childrenCount > 1 ? 'children' : 'child')}`);

  if (items.length === 0) return null;

  return (
    <div className="status-panel">
      <div className="status-panel__stage">{stageName}</div>
      <div className="status-panel__tags">
        {items.map((item, i) => (
          <span key={i} className="status-panel__tag">{item}</span>
        ))}
      </div>
    </div>
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
      <button className="start-screen__btn" onClick={onStart} id="start-btn">
        {t.startButton}
      </button>
      <div className="start-screen__features">
        <div className="start-screen__feature">
          <span className="start-screen__feature-icon">🎲</span>
          <span>{t.featureRandom}</span>
        </div>
        <div className="start-screen__feature">
          <span className="start-screen__feature-icon">📖</span>
          <span>{t.featureEvents}</span>
        </div>
        <div className="start-screen__feature">
          <span className="start-screen__feature-icon">🔄</span>
          <span>{t.featureReplay}</span>
        </div>
        <div className="start-screen__feature">
          <span className="start-screen__feature-icon">⚡</span>
          <span>{t.featureEndings}</span>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENT: EventView ===== */
function EventView({
  event,
  character,
  onSelectChoice,
  loading,
}: {
  event: GameEvent;
  character: Character;
  onSelectChoice: (choiceId: number) => void;
  loading: boolean;
}) {
  const { t, lang } = useI18n();
  return (
    <>
      <div className="event-card">
        <span className="event-card__age-badge">{t.ageBadge} {character.age}</span>
        <h2 className="event-card__title">{tc(event.title_en, event.title_vi, lang)}</h2>
        <p className="event-card__description">{tc(event.description_en, event.description_vi, lang)}</p>
      </div>

      <div className="choices">
        <span className="choices__title">{t.yourChoices}</span>
        {event.choices.map((choice, index) => {
          const available = isChoiceAvailable(choice, character);
          return (
            <button
              key={choice.id}
              className="choice-btn"
              onClick={() => onSelectChoice(choice.id)}
              disabled={!available || loading}
              id={`choice-${choice.id}`}
            >
              <span className="choice-btn__number">{index + 1}</span>
              <span className="choice-btn__text">{tc(choice.content_en, choice.content_vi, lang)}</span>
              {!available && (
                <span className="choice-btn__locked">{t.locked}</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ===== COMPONENT: OutcomeView ===== */
function OutcomeView({
  result,
  rolling,
  onContinue,
}: {
  result: SelectResult | null;
  rolling: boolean;
  onContinue: () => void;
}) {
  const { t, lang } = useI18n();

  const statLabels: Record<string, { icon: string; label: string }> = {
    health: { icon: '❤️', label: t.statHealth },
    money: { icon: '💰', label: t.statMoney },
    happiness: { icon: '😊', label: t.statHappiness },
    age: { icon: '🎂', label: t.statAge },
  };

  if (rolling) {
    return (
      <div className="outcome-card">
        <div className="outcome-card__dice outcome-card__dice--rolling">🎲</div>
        <div className="outcome-card__roll">...</div>
        <div className="outcome-card__roll-label">{t.rollingDice}</div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="outcome-card">
      <div className="outcome-card__dice">🎲</div>
      <div className="outcome-card__roll">{result.roll}</div>
      <div className="outcome-card__roll-label">{t.diceResult}</div>
      <p className="outcome-card__message">{tc(result.outcome.message_en, result.outcome.message_vi, lang)}</p>

      {result.outcome.stat_changes && (
        <div className="outcome-card__changes">
          {Object.entries(result.outcome.stat_changes).map(([stat, change]) => (
            <span
              key={stat}
              className={`stat-change ${change > 0 ? 'stat-change--positive' : 'stat-change--negative'}`}
            >
              {statLabels[stat]?.icon || '📊'}{' '}
              {change > 0 ? '+' : ''}{stat === 'money' ? formatMoney(change) : change}{' '}
              {statLabels[stat]?.label || stat}
            </span>
          ))}
        </div>
      )}

      <button className="continue-btn" onClick={onContinue} id="continue-btn">
        {result.game_over ? t.viewResults : t.continueBtn}
      </button>
    </div>
  );
}

/* ===== COMPONENT: GameOverScreen ===== */
function GameOverScreen({
  character,
  onRestart,
}: {
  character: Character;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const isDeath = character.health <= 0;
  const isBankrupt = character.money < 0;
  const isDepressed = character.happiness <= 0;
  
  let emoji = '🎉';
  if (isDeath) emoji = '💀';
  else if (isBankrupt) emoji = '💸';
  else if (isDepressed) emoji = '🌧️';

  let title = t.retirementTitle;
  if (isDeath) title = t.deathTitle;
  else if (isBankrupt) title = t.bankruptTitle;
  else if (isDepressed) title = t.depressedTitle;

  let subtitle = t.retirementSubtitle(character.age);
  if (isDeath) subtitle = t.deathSubtitle(character.age);
  else if (isBankrupt) subtitle = t.bankruptSubtitle(character.age);
  else if (isDepressed) subtitle = t.depressedSubtitle(character.age);

  return (
    <div className="gameover-screen">
      <div className="gameover-screen__emoji">{emoji}</div>
      <h1 className="gameover-screen__title">{title}</h1>
      <p className="gameover-screen__subtitle">{subtitle}</p>
      <div className="gameover-screen__stats">
        <div className="gameover-stat">
          <div className="gameover-stat__label">{t.statAge}</div>
          <div className="gameover-stat__value">🎂 {character.age}</div>
        </div>
        <div className="gameover-stat">
          <div className="gameover-stat__label">{t.statMoney}</div>
          <div className="gameover-stat__value">💰 {formatMoney(character.money)}</div>
        </div>
        <div className="gameover-stat">
          <div className="gameover-stat__label">{t.statHealth}</div>
          <div className="gameover-stat__value">❤️ {character.health}</div>
        </div>
        <div className="gameover-stat">
          <div className="gameover-stat__label">{t.statHappiness}</div>
          <div className="gameover-stat__value">😊 {character.happiness}</div>
        </div>
      </div>
      <button className="gameover-screen__btn" onClick={onRestart} id="restart-btn">
        {t.playAgain}
      </button>
    </div>
  );
}

/* ===== COMPONENT: TurnSummaryPopup ===== */
function TurnSummaryPopup({
  items,
  character,
  onDismiss,
}: {
  items: TurnSummaryItem[];
  character: Character;
  onDismiss: () => void;
}) {
  const { lang } = useI18n();

  const statEmoji: Record<string, string> = {
    health: '❤️',
    money: '💰',
    happiness: '😊',
  };

  return (
    <div className="game-screen">
      <div className="container">
        <StatsBar character={character} />
        <StatusPanel character={character} />
        <div className="event-card">
          <h2 className="event-card__title">
            {lang === 'vi' ? `📊 Tổng kết năm (Tuổi ${character.age})` : `📊 Year Summary (Age ${character.age})`}
          </h2>
          <div className="turn-summary-list">
            {items.map((item, i) => (
              <div
                key={i}
                className={`turn-summary-item ${item.value >= 0 ? 'turn-summary-item--positive' : 'turn-summary-item--negative'}`}
              >
                <span className="turn-summary-item__icon">{statEmoji[item.stat] || '📌'}</span>
                <span className="turn-summary-item__text">
                  {lang === 'vi' ? item.message_vi : item.message_en}
                </span>
                <span className="turn-summary-item__value">
                  {item.value >= 0 ? `+${item.value}` : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button className="continue-btn" onClick={onDismiss} id="summary-continue-btn">
          {lang === 'vi' ? 'Tiếp tục ▸' : 'Continue ▸'}
        </button>
      </div>
    </div>
  );
}

/* ===== MAIN APP ===== */
function App() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<GamePhase>('start');
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [result, setResult] = useState<SelectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [turnSummary, setTurnSummary] = useState<TurnSummaryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleStart = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const newCharacter = await api.createCharacter();
      setCharacter(newCharacter);
      const event = await api.getEvent(newCharacter.id);
      setCurrentEvent(event);
      setPhase('event');
    } catch (err: any) {
      setError(err.message || t.errorStart);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSelectChoice = useCallback(async (choiceId: number) => {
    if (!character) return;
    try {
      setLoading(true);
      clearError();
      setPhase('rolling');
      setRolling(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const selectResult = await api.selectChoice(choiceId, character.id);
      setResult(selectResult);
      setCharacter(selectResult.character);
      setRolling(false);
      setPhase('outcome');
    } catch (err: any) {
      setError(err.message || t.errorChoice);
      setRolling(false);
      setPhase('event');
    } finally {
      setLoading(false);
    }
  }, [character, t]);

  const handleContinue = useCallback(async () => {
    if (!character || !result) return;
    if (result.game_over) {
      setPhase('gameover');
      return;
    }
    try {
      setLoading(true);
      clearError();
      const response = await api.updateCharacter(character.id, {
        age: character.age + 1,
      });
      const updatedCharacter = response.character;
      const summary = response.turn_summary || [];
      setCharacter(updatedCharacter);

      // Check if health hit 0 from degradation
      if (updatedCharacter.health <= 0) {
        setPhase('gameover');
        return;
      }

      // Check bankruptcy
      if (updatedCharacter.money < 0) {
        setPhase('gameover');
        return;
      }

      // Check depression
      if (updatedCharacter.happiness <= 0) {
        setPhase('gameover');
        return;
      }

      // Check retirement (age 80)
      if (updatedCharacter.age >= 80) {
        setPhase('gameover');
        return;
      }

      // Show turn summary popup if there are items
      if (summary.length > 0) {
        setTurnSummary(summary);
        setPhase('turn_summary');
        return;
      }

      // Otherwise load next event directly
      const nextEventId = result.outcome.next_event_id;
      try {
        const event = await api.getEvent(updatedCharacter.id, nextEventId || undefined);
        setCurrentEvent(event);
        setResult(null);
        setPhase('event');
      } catch {
        setPhase('gameover');
      }
    } catch (err: any) {
      setError(err.message || t.errorContinue);
    } finally {
      setLoading(false);
    }
  }, [character, result, t]);

  const handleDismissSummary = useCallback(async () => {
    if (!character || !result) return;
    try {
      setLoading(true);
      clearError();
      const nextEventId = result.outcome.next_event_id;
      try {
        const event = await api.getEvent(character.id, nextEventId || undefined);
        setCurrentEvent(event);
        setResult(null);
        setTurnSummary([]);
        setPhase('event');
      } catch {
        setPhase('gameover');
      }
    } catch (err: any) {
      setError(err.message || t.errorContinue);
    } finally {
      setLoading(false);
    }
  }, [character, result, t]);

  const handleRestart = useCallback(() => {
    setPhase('start');
    setCharacter(null);
    setCurrentEvent(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      {/* Language Switcher */}
      <LangSwitcher />

      {/* Error Banner */}
      {error && (
        <div className="container" style={{ paddingTop: '16px' }}>
          <div className="error-banner">⚠️ {error}</div>
        </div>
      )}

      {/* Start Screen */}
      {phase === 'start' && <StartScreen onStart={handleStart} />}

      {/* Loading */}
      {loading && phase === 'start' && (
        <div className="loading">
          <div className="loading__spinner" />
          <span className="loading__text">{t.creatingLife}</span>
        </div>
      )}

      {/* Game Screen */}
      {(phase === 'event' || phase === 'rolling' || phase === 'outcome') && character && (
        <div className="game-screen">
          <div className="container">
            <StatsBar character={character} />
            <StatusPanel character={character} />
            {phase === 'event' && currentEvent && (
              <EventView
                event={currentEvent}
                character={character}
                onSelectChoice={handleSelectChoice}
                loading={loading}
              />
            )}
            {(phase === 'rolling' || phase === 'outcome') && (
              <OutcomeView
                result={result}
                rolling={rolling}
                onContinue={handleContinue}
              />
            )}
          </div>
        </div>
      )}

      {/* Turn Summary Popup */}
      {phase === 'turn_summary' && character && turnSummary.length > 0 && (
        <TurnSummaryPopup
          items={turnSummary}
          character={character}
          onDismiss={handleDismissSummary}
        />
      )}

      {/* Game Over */}
      {phase === 'gameover' && character && (
        <GameOverScreen character={character} onRestart={handleRestart} />
      )}
    </>
  );
}

export default App;
