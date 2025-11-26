import { Component, AfterViewInit, OnInit, HostListener } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, HeaderComponent, FooterComponent]
})
export class FaqComponent implements OnInit, AfterViewInit {
  activeCategory: string = 'system';
  showBackToTop: boolean = false;

  categories: Category[] = [
    { id: 'system', name: 'Sobre o Sistema' },
    { id: 'plans', name: 'Planos e Pagamentos' },
    { id: 'features', name: 'Funcionalidades' },
    { id: 'security', name: 'Dados e Segurança' },
    { id: 'support', name: 'Suporte e Ajuda' }
  ];

  systemFaqs: FaqItem[] = [
    {
      question: 'O que é o Smart Oficina?',
      answer: 'Smart Oficina é um sistema de gestão completo para oficinas mecânicas, disponível na nuvem. Ele oferece funcionalidades para controle de clientes, veículos, ordens de serviço, estoque, financeiro e muito mais, tudo em uma única plataforma acessível de qualquer dispositivo com internet.',
      isOpen: false
    },
    {
      question: 'Como o Smart Oficina pode ajudar minha oficina?',
      answer: 'O Smart Oficina ajuda sua oficina a ser mais organizada e eficiente, ao centralizar todas as informações em um único lugar. Você terá controle total do histórico de clientes e veículos, gestão de ordens de serviço, controle de estoque, fluxo de caixa, e enviará lembretes automáticos para clientes. Isso resulta em melhor relacionamento com clientes, redução de tarefas manuais e aumento da lucratividade.',
      isOpen: false
    },
    {
      question: 'Preciso instalar algum software para usar o Smart Oficina?',
      answer: 'Não, o Smart Oficina é um sistema 100% online (SaaS - Software as a Service). Você precisa apenas de um navegador web atualizado e acesso à internet para utilizar o sistema de qualquer dispositivo, sem necessidade de instalação.',
      isOpen: false
    },
    {
      question: 'Quais são os requisitos mínimos para usar o sistema?',
      answer: 'Para usar o Smart Oficina, você precisa de:<br><br>• Um computador, tablet ou smartphone com acesso à internet<br>• Navegador web atualizado (Google Chrome, Mozilla Firefox, Microsoft Edge ou Safari)<br>• Conexão de internet estável<br><br>Não há requisitos especiais de hardware, pois todo o processamento é feito na nuvem.',
      isOpen: false
    },
    {
      question: 'Posso utilizar o sistema em mais de um dispositivo ao mesmo tempo?',
      answer: 'Sim, você pode acessar o Smart Oficina simultaneamente em vários dispositivos, dependendo do seu plano de assinatura. Isso permite que diferentes colaboradores da sua oficina trabalhem ao mesmo tempo no sistema.',
      isOpen: false
    }
  ];

  plansFaqs: FaqItem[] = [
    {
      question: 'Quais são os planos disponíveis?',
      answer: 'Oferecemos diferentes planos para atender às necessidades de oficinas de todos os tamanhos. Desde planos básicos com funcionalidades essenciais até planos completos com todas as funcionalidades disponíveis. Você pode consultar detalhes sobre cada plano na seção "Planos e Preços" do nosso site.',
      isOpen: false
    },
    {
      question: 'Como funciona o pagamento?',
      answer: 'O pagamento é realizado por meio de assinatura mensal, com cobrança automática via cartão de crédito. Também oferecemos opções de parcelamento para planos anuais. Você receberá faturas automaticamente por e-mail e poderá consultá-las a qualquer momento no sistema.',
      isOpen: false
    },
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim, você pode fazer upgrade do seu plano a qualquer momento. Ao fazer upgrade, você terá acesso imediato às novas funcionalidades, com ajuste proporcional de valores.',
      isOpen: false
    },
    {
      question: 'Existe período de fidelidade?',
      answer: 'Não há período de fidelidade. Você pode cancelar sua assinatura a qualquer momento. No entanto, oferecemos descontos especiais para pagamentos anuais, o que pode ser vantajoso para oficinas que desejam um compromisso de longo prazo.',
      isOpen: false
    },
    {
      question: 'Existe garantia de satisfação?',
      answer: 'Sim, oferecemos garantia de satisfação de 30 dias para novos usuários. Se você não estiver satisfeito com o sistema dentro deste período, devolveremos integralmente o valor pago. Essa garantia também se aplica à primeira troca de plano.',
      isOpen: false
    },
    {
      question: 'O que acontece se eu cancelar minha assinatura?',
      answer: 'Se você cancelar sua assinatura, seu acesso ao sistema continuará ativo até o final do período já pago. Após esse período, você perderá o acesso ao sistema, mas seus dados ficarão armazenados por 90 dias. Durante esse período, você pode reativar sua conta e recuperar todos os seus dados. Após 90 dias, por questões de segurança e conformidade, os dados serão permanentemente excluídos.',
      isOpen: false
    }
  ];

  featuresFaqs: FaqItem[] = [
    {
      question: 'É possível cadastrar vários usuários/funcionários?',
      answer: 'Sim, dependendo do seu plano, você pode cadastrar múltiplos usuários com diferentes níveis de acesso. Isso permite controlar quem pode visualizar ou editar informações específicas no sistema, garantindo segurança e organização para sua oficina.',
      isOpen: false
    },
    {
      question: 'O sistema emite notas fiscais?',
      answer: 'O Smart Oficina permite gerar orçamentos e recibos detalhados. Para a emissão de notas fiscais, oferecemos integração com os principais sistemas de emissão de notas fiscais eletrônicas do mercado, facilitando o processo e mantendo seu controle fiscal em dia.',
      isOpen: false
    },
    {
      question: 'Como funciona o controle de estoque?',
      answer: 'O controle de estoque do Smart Oficina permite:<br><br>• Cadastrar peças e produtos com códigos, descrições e imagens<br>• Definir níveis mínimos de estoque para alertas automáticos<br>• Registrar entradas e saídas de produtos<br>• Integração com ordens de serviço para baixa automática<br>• Gestão de fornecedores<br>• Relatórios de movimentação e valoração de estoque<br><br>Tudo isso de forma simples e intuitiva, ajudando sua oficina a evitar perdas e otimizar compras.',
      isOpen: false
    },
    {
      question: 'O sistema envia lembretes para os clientes?',
      answer: 'Sim, o Smart Oficina envia lembretes automáticos para seus clientes via WhatsApp e e-mail. Você pode configurar lembretes para manutenções preventivas, aniversários, vencimento de documentos do veículo, agendamentos e muito mais. Essa funcionalidade ajuda a fidelizar clientes e aumentar o retorno de serviços.',
      isOpen: false
    },
    {
      question: 'Como funciona o agendamento de serviços?',
      answer: 'O módulo de agendamento permite marcar serviços com data e horário, visualizar a agenda diária, semanal ou mensal, distribuir serviços entre os mecânicos e enviar lembretes automáticos aos clientes. Você pode configurar a duração padrão para cada tipo de serviço e verificar a disponibilidade em tempo real.',
      isOpen: false
    },
    {
      question: 'Posso acessar de dispositivos móveis?',
      answer: 'Sim, o Smart Oficina é totalmente responsivo e pode ser acessado de qualquer dispositivo com navegador e internet, incluindo smartphones e tablets. Isso permite que você gerencie sua oficina de qualquer lugar, a qualquer momento.',
      isOpen: false
    },
    {
      question: 'É possível personalizar o sistema com a identidade da minha oficina?',
      answer: 'Sim, você pode personalizar orçamentos, recibos e comunicações com clientes inserindo sua logo, cores e informações de contato da sua oficina. Isso ajuda a reforçar sua marca em todos os pontos de contato com o cliente.',
      isOpen: false
    }
  ];

  securityFaqs: FaqItem[] = [
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim, a segurança é uma prioridade no Smart Oficina. Utilizamos criptografia de dados, servidores com certificados de segurança, backups automáticos e seguimos as melhores práticas de proteção de dados. Nossos servidores ficam em data centers de alta segurança, garantindo a proteção de suas informações.',
      isOpen: false
    },
    {
      question: 'Como é feito o backup das informações?',
      answer: 'Realizamos backups automáticos diários de todos os dados do sistema. Além disso, utilizamos redundância geográfica, o que significa que seus dados são armazenados em diferentes localizações físicas, proporcionando mais uma camada de segurança contra perda de informações.',
      isOpen: false
    },
    {
      question: 'Posso exportar meus dados?',
      answer: 'Sim, o Smart Oficina permite exportar seus dados em formatos comuns como CSV e PDF. Você pode exportar relatórios, cadastros de clientes, histórico de serviços e outras informações para usar em outras ferramentas ou para manter seu próprio backup.',
      isOpen: false
    },
    {
      question: 'O sistema está de acordo com a LGPD?',
      answer: 'Sim, o Smart Oficina está em conformidade com a Lei Geral de Proteção de Dados (LGPD). Implementamos todas as medidas necessárias para garantir a privacidade e segurança dos dados, incluindo termos de uso claros, políticas de privacidade transparentes e opções para que seus clientes possam exercer seus direitos quanto aos dados pessoais.',
      isOpen: false
    },
    {
      question: 'O que acontece com meus dados se eu cancelar a assinatura?',
      answer: 'Se você cancelar sua assinatura, seus dados permanecerão armazenados com segurança por 90 dias. Durante esse período, você pode reativar sua conta e recuperar todos os seus dados. Após esse prazo, por motivos de segurança e conformidade com a LGPD, os dados serão permanentemente excluídos de nossos servidores.',
      isOpen: false
    }
  ];

  supportFaqs: FaqItem[] = [
    {
      question: 'Como funciona o suporte técnico?',
      answer: 'Oferecemos suporte por múltiplos canais: chat ao vivo, WhatsApp, e-mail e sistema de tickets. Nossa equipe está disponível em horário comercial (8h às 18h) de segunda a sexta-feira. Dependendo do seu plano, você pode ter acesso a suporte prioritário com tempos de resposta menores.',
      isOpen: false
    },
    {
      question: 'Existe treinamento disponível?',
      answer: 'Sim, oferecemos materiais de treinamento completos para todos os usuários, incluindo:<br><br>• Vídeos tutoriais<br>• Manuais em PDF<br>• Base de conhecimento<br>• Webinars gratuitos periódicos<br><br>Para planos mais avançados, também oferecemos sessões de treinamento personalizadas via videoconferência.',
      isOpen: false
    },
    {
      question: 'Quanto tempo leva para adaptar minha oficina ao sistema?',
      answer: 'O tempo de adaptação varia conforme o tamanho da oficina e familiaridade da equipe com sistemas digitais. Em média, usuários conseguem dominar as funcionalidades básicas em 1 a 2 semanas. Para uso avançado de todas as funcionalidades, pode levar até 30 dias. Nossa equipe de suporte estará disponível durante todo esse processo de adaptação.',
      isOpen: false
    },
    {
      question: 'Vocês oferecem algum tipo de consultoria para implementação?',
      answer: 'Sim, para oficinas que desejam uma implementação mais rápida e personalizada, oferecemos serviços de consultoria. Nossos especialistas podem ajudar com a configuração inicial, importação de dados existentes, personalização de fluxos de trabalho e treinamento da equipe. Esses serviços são cobrados separadamente da assinatura.',
      isOpen: false
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.systemFaqs[0].isOpen = true;
    window.scrollTo(0, 0);
  }

  ngAfterViewInit(): void {
    this.setupScrollListener();

    setTimeout(() => {
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        item.classList.add('animated');
      });
    }, 2000);
  }

  setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.checkVisibleCategory();

      this.showBackToTop = window.scrollY > 300;
    });
  }

  checkVisibleCategory(): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeCategory = entry.target.id;
          }
        });
      }, { threshold: 0.5 });

      this.categories.forEach(category => {
        const element = document.getElementById(category.id);
        if (element) {
          observer.observe(element);
        }
      });
    } else {
      this.categories.forEach(category => {
        const element = document.getElementById(category.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            this.activeCategory = category.id;
          }
        }
      });
    }
  }

  toggleFaq(category: string, index: number): void {
    switch (category) {
      case 'system':
        this.systemFaqs[index].isOpen = !this.systemFaqs[index].isOpen;
        break;
      case 'plans':
        this.plansFaqs[index].isOpen = !this.plansFaqs[index].isOpen;
        break;
      case 'features':
        this.featuresFaqs[index].isOpen = !this.featuresFaqs[index].isOpen;
        break;
      case 'security':
        this.securityFaqs[index].isOpen = !this.securityFaqs[index].isOpen;
        break;
      case 'support':
        this.supportFaqs[index].isOpen = !this.supportFaqs[index].isOpen;
        break;
    }
  }

  scrollToCategory(categoryId: string): void {
    this.activeCategory = categoryId;
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.showBackToTop = window.scrollY > 300;
  }
}