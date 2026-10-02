import {
  ChatSession,
  ExplainResult,
  SummaryResult,
  QuizAttempt,
  RecentActivityItem,
  UserPreferences,
} from '../types';

const CHATS_KEY = 'studygpt_chats';
const CURRENT_CHAT_ID_KEY = 'studygpt_current_chat_id';
const ACTIVITIES_KEY = 'studygpt_activities';
const PREFERENCES_KEY = 'studygpt_preferences';
const SAVED_EXPLAINS_KEY = 'studygpt_saved_explains';
const SAVED_SUMMARIES_KEY = 'studygpt_saved_summaries';

export const DEFAULT_PREFERENCES: UserPreferences = {
  studyLevel: 'Undergraduate',
  defaultDifficulty: 'Intermediate',
};

const DEFAULT_CHATS: ChatSession[] = [
  {
    id: 'chat-bayes-theorem',
    title: "Bayes' Theorem",
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: "Explain Bayes' theorem in simple words.",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'model',
        content: `**Bayes' Theorem** is essentially a mathematical formula for updating your beliefs when you receive new evidence.

### The Big Idea:
Imagine you wake up and hear raindrops. You might immediately think: *"It's raining!"* But then you realize you left your lawn sprinkler on. Bayes' Theorem helps calculate the *exact* updated probability of rain taking into account both your initial prior knowledge and the new observation.

### The Formula:
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

- **$P(A|B)$ (Posterior):** How likely $A$ is given that $B$ happened.
- **$P(B|A)$ (Likelihood):** If $A$ were true, how likely would evidence $B$ be?
- **$P(A)$ (Prior):** How likely was $A$ before seeing any evidence?
- **$P(B)$ (Marginal Evidence):** Total probability of seeing evidence $B$.

### University Example (Medical Testing):
Suppose a rare disease affects 1 in 1,000 students (0.1% prior). A test is 99% accurate (true positive rate). If a student tests positive, what is the probability they actually have the disease?
Due to the low prior, even with a 99% accurate test, most positives are actually false positives! Bayes' theorem shows the true posterior is approximately **9%**, not 99%.

Would you like me to work through a step-by-step calculation table?`,
        timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      },
    ],
  },
  {
    id: 'chat-cybersecurity',
    title: 'Cybersecurity',
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    messages: [
      {
        id: 'msg-cyber-1',
        role: 'user',
        content: 'What is the CIA Triad in Cybersecurity?',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: 'msg-cyber-2',
        role: 'model',
        content: `The **CIA Triad** is the foundational benchmark for information security across computer science and enterprise systems:

1. **Confidentiality:** Preventing unauthorized disclosure. Ensures only authenticated parties access sensitive data (e.g., encryption, access control lists).
2. **Integrity:** Guarding against improper data modification or deletion. Ensures data authenticity (e.g., cryptographic hashes like SHA-256, digital signatures).
3. **Availability:** Ensuring authorized users have timely, reliable access to assets (e.g., redundancy, DDoS mitigation, failover clusters).

*Key Exam Tip:* Security controls often involve trade-offs between these three pillars. For instance, extreme confidentiality controls can sometimes reduce operational availability.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 179).toISOString(),
      },
    ],
  },
  {
    id: 'chat-data-structures',
    title: 'Data Structures',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    messages: [
      {
        id: 'msg-ds-1',
        role: 'user',
        content: 'When should I use a Hash Table vs a Balanced Binary Search Tree (Red-Black Tree)?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: 'msg-ds-2',
        role: 'model',
        content: `Great computer science exam question! Here is how to decide between a **Hash Table** and a **Balanced BST**:

### 1. Hash Table (e.g., \`HashMap\`, \`unordered_map\`)
- **Lookup/Insert/Delete:** Average **$O(1)$**, Worst-case **$O(n)$** during hash collisions.
- **Ordering:** None. Keys are distributed randomly according to the hash function.
- **Use When:** You need instant lookups by key and do not care about sorted order or range queries.

### 2. Balanced BST (e.g., Red-Black Tree, \`std::map\`, \`TreeMap\`)
- **Lookup/Insert/Delete:** Guaranteed **$O(\\log n)$** even in worst-case.
- **Ordering:** In-order traversal yields items in sorted order in $O(n)$ time.
- **Range Queries:** Efficiently find elements between $[k_1, k_2]$ in $O(\\log n + k)$.
- **Use When:** You require sorted data, successor/predecessor queries, or range filtering.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  },
];

const DEFAULT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'act-1',
    type: 'chat',
    title: "Bayes' Theorem",
    subtitle: 'Chat discussion on probability & prior distribution',
    timestamp: '45 minutes ago',
    targetTab: 'chat',
    metadata: { chatId: 'chat-bayes-theorem' },
  },
  {
    id: 'act-2',
    type: 'explain',
    title: 'Heapsort Algorithm',
    subtitle: 'Explained at Intermediate difficulty with code example',
    timestamp: '2 hours ago',
    targetTab: 'explain',
  },
  {
    id: 'act-3',
    type: 'quiz',
    title: 'Data Structures MCQ Quiz',
    subtitle: 'Score: 4/5 (80%) on Binary Trees & Graphs',
    timestamp: 'Yesterday',
    targetTab: 'quiz',
  },
  {
    id: 'act-4',
    type: 'summarize',
    title: 'Operating Systems: Deadlock & Mutex',
    subtitle: '3 key points extracted with 4 defined glossary terms',
    timestamp: '2 days ago',
    targetTab: 'summarize',
  },
];

export function getStoredChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) {
      localStorage.setItem(CHATS_KEY, JSON.stringify(DEFAULT_CHATS));
      return DEFAULT_CHATS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CHATS;
  }
}

export function saveStoredChats(chats: ChatSession[]): void {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats to localStorage', e);
  }
}

export function getCurrentChatId(): string {
  const stored = localStorage.getItem(CURRENT_CHAT_ID_KEY);
  if (stored) return stored;
  const chats = getStoredChats();
  const first = chats[0]?.id || 'chat-bayes-theorem';
  localStorage.setItem(CURRENT_CHAT_ID_KEY, first);
  return first;
}

export function setCurrentChatId(id: string): void {
  localStorage.setItem(CURRENT_CHAT_ID_KEY, id);
}

export function getStoredActivities(): RecentActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
      return DEFAULT_ACTIVITIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export function addRecentActivity(activity: Omit<RecentActivityItem, 'id' | 'timestamp'>): void {
  try {
    const activities = getStoredActivities();
    const newAct: RecentActivityItem = {
      ...activity,
      id: 'act-' + Date.now(),
      timestamp: 'Just now',
    };
    const updated = [newAct, ...activities.filter(a => a.title !== activity.title)].slice(0, 10);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record activity', e);
  }
}

export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(pref: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(pref));
  } catch (e) {
    console.error('Failed to save preferences', e);
  }
}
