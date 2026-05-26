
import { getDB, setDB } from './mock-db';
import type { User, Company, Task, Submission, Evaluation, SubmissionStatus, Invoice, Plan, Subscription, BillingCycle, Badge, Activity, Notification, TaskTemplate, SystemLog, SystemError, SystemIncident, SystemMetric, ServiceStatus, ServiceLoad, ScalingEvent, ApiIntegration, IntegrationLog, Webhook, WebhookTriggerLog, GitHubRepository, Team, PlanUsage, UsageMetric, RevenueMetric, PlanDistribution, RevenueSource, EvaluationSchema, TestCase } from './types';

const ARTIFICIAL_DELAY = 300;

// --- UTILITY ---
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const simulateApiCall = <T>(data: T): Promise<{ success: true; data: T }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, data });
    }, Math.random() * 500 + 300); // 300-800ms delay
  });
};

// --- USER APIs ---

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: true; data: User }> => {
  const db = getDB();
  const newUser: User = {
    ...userData,
    id: generateId('user'),
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  setDB({ ...db, users: [...db.users, newUser] });
  return simulateApiCall(newUser);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: true; data: User | undefined }> => {
    const db = getDB();
    let updatedUser: User | undefined;
    const newUsers = db.users.map(u => {
        if (u.id === userId) {
            updatedUser = {
                ...u,
                ...updates,
                profile: {
                    ...(u.profile || {}),
                    ...updates.profile
                }
            };
            return updatedUser;
        }
        return u;
    });
    setDB({ ...db, users: newUsers });
    return simulateApiCall(updatedUser);
};


export const getUserById = async (id: string): Promise<{ success: true; data: User | undefined }> => {
  const db = getDB();
  const user = db.users.find(u => u.id === id);
  return simulateApiCall(user);
};

export const getAllUsers = async (): Promise<{ success: true; data: User[] }> => {
  const db = getDB();
  return simulateApiCall(db.users);
};


// --- COMPANY APIs ---

export const createCompany = async (companyData: Omit<Company, 'id' | 'createdAt'>): Promise<{ success: true; data: Company }> => {
  const db = getDB();
  const newCompany: Company = {
    ...companyData,
    id: generateId('co'),
    createdAt: new Date().toISOString(),
  };
  setDB({ ...db, companies: [...db.companies, newCompany] });
  return simulateApiCall(newCompany);
};

export const getCompanyById = async (id: string): Promise<{ success: true; data: Company | undefined }> => {
  const db = getDB();
  const company = db.companies.find(c => c.id === id);
  return simulateApiCall(company);
};

export const getAllCompanies = async (): Promise<{ success: true; data: Company[] }> => {
    const db = getDB();
    return simulateApiCall(db.companies);
};


// --- TASK APIs ---

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: true; data: Task }> => {
  const db = getDB();
  const now = new Date().toISOString();
  const newTask: Task = {
    ...taskData,
    id: generateId('task'),
    createdAt: now,
    updatedAt: now,
    assignedTo: [],
    isOpen: taskData.isOpen !== false, // default to true
    isPrivate: taskData.isPrivate || false, // default to false
  };

  const companyId = taskData.companyId;
  const company = db.companies.find(c => c.id === companyId);
  if (company) {
      const subscription = db.subscriptions.find(s => s.companyId === companyId && s.status === 'ACTIVE');
      if (subscription) {
          subscription.usage.tasksCreated += 1;
          setDB({...db, tasks: [...db.tasks, newTask], subscriptions: db.subscriptions.map(s => s.id === subscription.id ? subscription : s) });
      } else {
           setDB({ ...db, tasks: [...db.tasks, newTask] });
      }
  } else {
    setDB({ ...db, tasks: [...db.tasks, newTask] });
  }

  // Create an activity log entry
  const newActivity: Activity = {
    id: generateId('act'),
    performerId: taskData.createdBy,
    actionType: 'task_update',
    timestamp: now,
    targetEntity: { type: 'Task', id: newTask.id, name: newTask.title },
    status: 'Success',
    description: `Task "${newTask.title}" was created.`,
  };
  setDB({ ...getDB(), activities: [...getDB().activities, newActivity] });

  return simulateApiCall(newTask);
};

export const getAllTasks = async (): Promise<{ success: true; data: Task[] }> => {
  const db = getDB();
  return simulateApiCall(db.tasks);
};

export const getTaskById = async (taskId: string): Promise<{ success: true; data: Task | undefined }> => {
  const db = getDB();
  const task = db.tasks.find(t => t.id === taskId);
  return simulateApiCall(task);
};

export const getTasksByCompanyId = async (companyId: string): Promise<{ success: true; data: Task[] }> => {
  const db = getDB();
  const tasks = db.tasks.filter(t => t.companyId === companyId);
  return simulateApiCall(tasks);
}

// assignTask creates a new submission with status 'assigned' and updates the task's assignedTo array
export const assignTask = async (taskId: string, userId: string): Promise<{ success: true; data: Submission }> => {
  const db = getDB();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const existingSubmission = db.submissions.find(s => s.taskId === taskId && s.userId === userId);
  if (existingSubmission) return simulateApiCall(existingSubmission);
  
  // Update task's assignedTo array
  const updatedTasks = db.tasks.map(t => {
      if (t.id === taskId) {
          const assignedTo = t.assignedTo || [];
          if (!assignedTo.includes(userId)) {
              return { ...t, assignedTo: [...assignedTo, userId] };
          }
      }
      return t;
  });

  const now = new Date().toISOString();
  const newSubmission: Submission = {
    id: generateId('sub'),
    taskId,
    userId,
    companyId: task.companyId,
    status: 'assigned',
    assignedAt: now,
    lastUpdated: now,
  };
  setDB({ ...db, tasks: updatedTasks, submissions: [...db.submissions, newSubmission] });
  return simulateApiCall(newSubmission);
};

export const saveTaskAsTemplate = async (templateData: Omit<TaskTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): Promise<{ success: true, data: TaskTemplate }> => {
  const db = getDB();
  const now = new Date().toISOString();
  const newTemplate: TaskTemplate = {
      ...templateData,
      templateId: generateId('tpl'),
      createdAt: now,
      updatedAt: now,
  };
  setDB({ ...db, templates: [...db.templates, newTemplate] });
  return simulateApiCall(newTemplate);
};

export const getTemplates = async (): Promise<{ success: true; data: TaskTemplate[] }> => {
    const db = getDB();
    return simulateApiCall(db.templates);
};


// --- SUBMISSION APIs ---

export const createSubmission = async (submissionData: Omit<Submission, 'id'|'companyId'|'status'|'assignedAt'|'lastUpdated'>): Promise<{ success: true; data: Submission }> => {
  const db = getDB();
  const task = db.tasks.find(t => t.id === submissionData.taskId);
  if (!task) throw new Error("Task not found");
  
  const now = new Date().toISOString();
  const newSubmission: Submission = {
    ...submissionData,
    id: generateId('sub'),
    companyId: task.companyId,
    status: 'pending',
    assignedAt: now, // Should ideally exist, but we add it for robustness
    submittedAt: now,
    lastUpdated: now,
  };

  const company = db.companies.find(c => c.id === task.companyId);
  if (company) {
    const subscription = db.subscriptions.find(s => s.companyId === company.id && s.status === 'ACTIVE');
    if (subscription) {
        subscription.usage.submissionsReceived += 1;
        setDB({...db, submissions: [...db.submissions, newSubmission], subscriptions: db.subscriptions.map(s => s.id === subscription.id ? subscription : s)});
    } else {
        setDB({ ...db, submissions: [...db.submissions, newSubmission] });
    }
  } else {
    setDB({ ...db, submissions: [...db.submissions, newSubmission] });
  }

  // Create an activity log entry
  const user = db.users.find(u => u.id === newSubmission.userId);
  const newActivity: Activity = {
    id: generateId('act'),
    performerId: newSubmission.userId,
    actionType: 'submission',
    timestamp: now,
    targetEntity: { type: 'Submission', id: newSubmission.id, name: task.title },
    status: 'Success',
    description: `${user?.name || 'A user'} submitted work for "${task.title}".`,
  };
  setDB({ ...getDB(), activities: [...getDB().activities, newActivity] });

  return simulateApiCall(newSubmission);
};

export const getAllSubmissions = async (): Promise<{ success: true; data: Submission[] }> => {
    const db = getDB();
    return simulateApiCall(db.submissions);
}

export const getSubmissionById = async (id: string): Promise<{ success: true; data: Submission | undefined }> => {
    const db = getDB();
    const submission = db.submissions.find(s => s.id === id);
    return simulateApiCall(submission);
}

export const updateSubmission = async (submissionId: string, updates: Partial<Submission>): Promise<{ success: true; data: Submission | undefined }> => {
    const db = getDB();
    let updatedSubmission: Submission | undefined;
    const newSubmissions = db.submissions.map(s => {
        if (s.id === submissionId) {
            updatedSubmission = { ...s, ...updates, lastUpdated: new Date().toISOString() };
            return updatedSubmission;
        }
        return s;
    });
    setDB({ ...db, submissions: newSubmissions });
    return simulateApiCall(updatedSubmission);
};


export const updateSubmissionStatus = async (submissionId: string, status: SubmissionStatus): Promise<{ success: true; data: Submission | undefined }> => {
    return updateSubmission(submissionId, { status });
};

// --- EVALUATION APIs ---

export const createEvaluation = async (evaluationData: Omit<Evaluation, 'id' | 'evaluatedAt'>): Promise<{ success: true; data: Evaluation }> => {
  const db = getDB();
  const now = new Date().toISOString();
  const newEvaluation: Evaluation = {
    ...evaluationData,
    id: generateId('eval'),
    evaluatedAt: now,
  };
  
  const submissions = db.submissions.map(s => {
      if (s.id === evaluationData.submissionId) {
          return { ...s, status: 'evaluated' as SubmissionStatus, lastUpdated: now };
      }
      return s;
  });

  setDB({ ...db, evaluations: [...db.evaluations, newEvaluation], submissions });

  // Create an activity log entry
  const submission = submissions.find(s => s.id === evaluationData.submissionId);
  const user = db.users.find(u => u.id === evaluationData.evaluatedBy);
  const newActivity: Activity = {
    id: generateId('act'),
    performerId: evaluationData.evaluatedBy,
    actionType: 'status_change',
    timestamp: now,
    targetEntity: { type: 'Submission', id: evaluationData.submissionId },
    status: 'Success',
    description: `${user?.name || 'Evaluator'} completed the evaluation. Final score: ${newEvaluation.score}.`,
  };
  setDB({ ...getDB(), activities: [...getDB().activities, newActivity] });
  
  return simulateApiCall(newEvaluation);
};

export const getEvaluationBySubmissionId = async (submissionId: string): Promise<{ success: true; data: Evaluation | undefined }> => {
  const db = getDB();
  const evaluation = db.evaluations.find(e => e.submissionId === submissionId);
  return simulateApiCall(evaluation);
};

export const getAllEvaluations = async (): Promise<{ success: true, data: Evaluation[] }> => {
    const db = getDB();
    return simulateApiCall(db.evaluations);
};


// --- PAYMENT APIs (MOCK) ---
export const createPayment = async (data: { companyId: string, amount: number, planName: string, billingCycle: BillingCycle }): Promise<{ success: true, data: Invoice }> => {
    const db = getDB();
    const now = new Date();
    const newInvoice: Invoice = {
        id: generateId('inv'),
        companyId: data.companyId,
        amount: data.amount,
        date: now.toISOString(),
        dueDate: new Date(new Date(now).setDate(now.getDate() + 15)).toISOString(),
        status: 'Paid',
        planName: data.planName,
        billingPeriod: {
            start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
            end: new Date().toISOString(),
        },
        lineItems: [{ id: generateId('item'), description: `${data.planName} (${data.billingCycle})`, quantity: 1, unitPrice: data.amount, total: data.amount }],
        subtotal: data.amount,
        tax: 0,
    };
    setDB({ ...db, invoices: [...db.invoices, newInvoice] });
    return simulateApiCall(newInvoice);
}

export const getInvoicesByCompanyId = async (companyId: string): Promise<{ success: true, data: Invoice[] }> => {
    const db = getDB();
    const invoices = db.invoices.filter(inv => inv.companyId === companyId);
    return simulateApiCall(invoices);
}

// --- Subscription & Plan APIs ---

export const getAllPlans = async (): Promise<{ success: true; data: Plan[] }> => {
    const db = getDB();
    return simulateApiCall(db.plans);
}

export const getAllSubscriptions = async (): Promise<{ success: true; data: Subscription[] }> => {
    const db = getDB();
    return simulateApiCall(db.subscriptions);
}

export const getSubscriptionByCompany = async (companyId: string): Promise<{ success: true; data: Subscription | undefined }> => {
    const db = getDB();
    const subscription = db.subscriptions.find(s => s.companyId === companyId && s.status === 'ACTIVE');
    return simulateApiCall(subscription);
};

export const createSubscription = async (subData: Omit<Subscription, 'id'>): Promise<{ success: true; data: Subscription }> => {
  const db = getDB();
  const newSub: Subscription = {
    ...subData,
    id: generateId('sub'),
  };
  // Deactivate old subscription for that company if it exists
  const updatedSubscriptions = db.subscriptions.map(s => {
      if (s.companyId === subData.companyId) {
          return { ...s, status: 'CANCELED' as 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'TRIAL' };
      }
      return s;
  });
  
  setDB({ ...db, subscriptions: [...updatedSubscriptions, newSub] });
  return simulateApiCall(newSub);
};

export const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>): Promise<{ success: true; data: Subscription | undefined }> => {
    const db = getDB();
    let updatedSubscription: Subscription | undefined;
    const newSubscriptions = db.subscriptions.map(s => {
        if (s.id === subscriptionId) {
            updatedSubscription = { ...s, ...updates };
            return updatedSubscription;
        }
        return s;
    });
    setDB({ ...db, subscriptions: newSubscriptions });
    return simulateApiCall(updatedSubscription);
};


export const getAllInvoices = async (): Promise<{ success: true; data: Invoice[] }> => {
    const db = getDB();
    return simulateApiCall(db.invoices);
};

// --- Badge APIs ---
export const getAllBadges = async (): Promise<{ success: true; data: Badge[] }> => {
    const db = getDB();
    return simulateApiCall(db.badges);
};

// --- Activity & Notification APIs ---
export const getAllActivities = async (): Promise<{ success: true; data: Activity[] }> => {
    const db = getDB();
    return simulateApiCall(db.activities);
};

export const getAllNotifications = async (): Promise<{ success: true; data: Notification[] }> => {
    const db = getDB();
    return simulateApiCall(db.notifications);
};

// --- Admin / System APIs ---
export const getTestCasesBySubmission = async (submissionId: string): Promise<{ success: true; data: TestCase[] }> => {
  const db = getDB();
  const testCases = db.testCases.filter(tc => tc.submissionId === submissionId);
  return simulateApiCall(testCases);
};

export const getGitHubRepositories = async (): Promise<{ success: true; data: GitHubRepository[] }> => {
  const db = getDB();
  return simulateApiCall(db.githubRepositories);
};

export const getWebhooks = async (): Promise<{ success: true; data: Webhook[] }> => {
  const db = getDB();
  return simulateApiCall(db.webhooks);
};

export const getWebhookTriggerLogs = async (webhookId: string): Promise<{ success: true; data: WebhookTriggerLog[] }> => {
  const db = getDB();
  const logs = db.webhookTriggerLogs.filter(log => log.webhookId === webhookId);
  return simulateApiCall(logs);
};

export const getTeams = async (): Promise<{ success: true; data: Team[] }> => {
  const db = getDB();
  return simulateApiCall(db.teams);
};

export const getApiIntegrations = async (): Promise<{ success: true; data: ApiIntegration[] }> => {
  const db = getDB();
  return simulateApiCall(db.apiIntegrations);
};

export const getIntegrationLogs = async (): Promise<{ success: true; data: IntegrationLog[] }> => {
  const db = getDB();
  return simulateApiCall(db.integrationLogs);
};

export const getSystemMetrics = async (): Promise<{ success: true; data: SystemMetric[] }> => {
  const db = getDB();
  return simulateApiCall(db.systemMetrics);
};

export const getServiceStatus = async (): Promise<{ success: true; data: ServiceStatus[] }> => {
  const db = getDB();
  return simulateApiCall(db.serviceStatus);
};

export const getServiceLoad = async (): Promise<{ success: true; data: ServiceLoad[] }> => {
  const db = getDB();
  return simulateApiCall(db.serviceLoad);
};

export const getScalingEvents = async (): Promise<{ success: true; data: ScalingEvent[] }> => {
  const db = getDB();
  return simulateApiCall(db.scalingEvents);
};

export const getSystemIncidents = async (): Promise<{ success: true; data: SystemIncident[] }> => {
  const db = getDB();
  return simulateApiCall(db.systemIncidents);
};

export const getSystemLogs = async (): Promise<{ success: true; data: SystemLog[] }> => {
  const db = getDB();
  return simulateApiCall(db.systemLogs);
};

export const getSystemErrors = async (): Promise<{ success: true; data: SystemError[] }> => {
  const db = getDB();
  return simulateApiCall(db.systemErrors);
};

export const getPlanUsage = async (): Promise<{ success: true; data: PlanUsage[] }> => {
    const db = getDB();
    return simulateApiCall(db.planUsage);
};

export const getUsageMetrics = async (): Promise<{ success: true; data: UsageMetric[] }> => {
    const db = getDB();
    return simulateApiCall(db.usageMetrics);
};

export const getRevenueMetrics = async (): Promise<{ success: true; data: RevenueMetric[] }> => {
    const db = getDB();
    return simulateApiCall(db.revenueMetrics);
};

export const getPlanDistribution = async (): Promise<{ success: true; data: PlanDistribution[] }> => {
    const db = getDB();
    return simulateApiCall(db.planDistribution);
};

export const getRevenueSources = async (): Promise<{ success: true; data: RevenueSource[] }> => {
    const db = getDB();
    return simulateApiCall(db.revenueSources);
};
export const getEvaluationSchemas = async (): Promise<{ success: true; data: EvaluationSchema[] }> => {
  const db = getDB();
  return simulateApiCall(db.evaluationSchemas);
};
