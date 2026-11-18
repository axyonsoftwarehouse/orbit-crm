import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock,
  FileSignature,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Receipt,
  Search,
  Settings,
  Target,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; href: string; icon: LucideIcon }

export const NAV_ITEMS: NavItem[] = [
  { title: "Visão geral", href: "/app", icon: LayoutDashboard },
  { title: "Clientes", href: "/app/clientes", icon: Users },
  { title: "Leads", href: "/app/leads", icon: Target },
  { title: "SEO", href: "/app/seo", icon: Search },
  { title: "Social", href: "/app/social", icon: MessageSquare },
  { title: "Projetos", href: "/app/projetos", icon: FolderKanban },
  { title: "Tarefas", href: "/app/tarefas", icon: ListChecks },
  { title: "Timesheet", href: "/app/timesheet", icon: Clock },
  { title: "Calendário", href: "/app/calendario", icon: CalendarDays },
  { title: "Orçamentos", href: "/app/orcamentos", icon: FileText },
  { title: "Faturas", href: "/app/faturas", icon: Receipt },
  { title: "Despesas", href: "/app/despesas", icon: Wallet },
  { title: "Contratos", href: "/app/contratos", icon: FileSignature },
  { title: "Relatórios", href: "/app/relatorios", icon: BarChart3 },
  { title: "Atividades", href: "/app/atividades", icon: History },
  { title: "Metas", href: "/app/metas", icon: Trophy },
  { title: "Tickets", href: "/app/tickets", icon: LifeBuoy },
  {
    title: "Base de conhecimento",
    href: "/app/base-conhecimento",
    icon: BookOpen,
  },
  { title: "Configurações", href: "/app/configuracoes", icon: Settings },
]

/** Atalhos "Novo …": levam à lista, onde fica o botão de criar. */
export const NEW_ITEMS = [
  { href: "/app/clientes", label: "Cliente", command: "Novo cliente" },
  { href: "/app/leads", label: "Lead", command: "Novo lead" },
  { href: "/app/projetos", label: "Projeto", command: "Novo projeto" },
  { href: "/app/tarefas", label: "Tarefa", command: "Nova tarefa" },
  {
    href: "/app/orcamentos",
    label: "Orçamento",
    command: "Novo orçamento",
  },
  { href: "/app/faturas", label: "Fatura", command: "Nova fatura" },
  { href: "/app/tickets", label: "Ticket", command: "Novo ticket" },
]
