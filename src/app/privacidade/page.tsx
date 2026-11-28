import type { Metadata } from "next"
import Link from "next/link"
import {
  LegalPage,
  LegalSection,
  LegalValue,
} from "@/components/legal/legal-page"
import { LEGAL, LEGAL_PATHS } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Política de privacidade",
}

export default function PrivacyPage() {
  const product = LEGAL.productName
  return (
    <LegalPage
      title="Política de privacidade"
      intro={
        <>
          <p>
            Esta Política explica como o {product}, oferecido por{" "}
            <LegalValue field="companyName" />, inscrita no CNPJ{" "}
            <LegalValue field="cnpj" />, trata dados pessoais, em conformidade
            com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).
          </p>
          <p>
            Ela complementa os{" "}
            <Link href={LEGAL_PATHS.terms} className="text-primary underline">
              Termos de uso
            </Link>
            .
          </p>
        </>
      }
    >
      <LegalSection id="papeis" title="1. Quem decide sobre os dados">
        <ul>
          <li>
            <strong>Dados cadastrados pelas empresas contratantes</strong>{" "}
            (clientes, contatos, leads, projetos, tickets, arquivos etc.): a
            empresa contratante é a <strong>controladora</strong> e decide como
            e por que eles são usados. O {product} atua como{" "}
            <strong>operador</strong>, tratando esses dados só para prestar o
            serviço e conforme as instruções dela. Pedidos sobre esses dados
            devem ser feitos primeiro à empresa que os cadastrou.
          </li>
          <li>
            <strong>Dados de conta dos usuários</strong> (nome, e-mail e uso da
            plataforma): o {product} é o <strong>controlador</strong>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="dados" title="2. Dados que tratamos">
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail, senha (guardada apenas como
            hash pelo provedor de autenticação), foto, papel na empresa e
            preferências de notificação.
          </li>
          <li>
            <strong>Dados cadastrados no sistema:</strong> dados de clientes,
            contatos e leads (como nome, e-mail, telefone, empresa e cargo),
            atividades, projetos, tarefas, horas, orçamentos, faturas,
            contratos, tickets, posts e os arquivos enviados.
          </li>
          <li>
            <strong>Portal do cliente:</strong> nome e e-mail dos clientes
            finais convidados e as respostas deles (aprovações, comentários,
            chamados).
          </li>
          <li>
            <strong>Registros técnicos:</strong> data e hora de ações
            importantes, endereço IP usado temporariamente para limitar
            tentativas de acesso, e registros de erro para correção de falhas.
          </li>
          <li>
            <strong>Redes sociais (quando conectadas):</strong> identificador e
            nome da conta e os tokens de acesso necessários para publicar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="finalidades" title="3. Para que usamos">
        <ul>
          <li>
            Prestar o serviço contratado: autenticar, armazenar, exibir e
            processar os dados (execução de contrato, art. 7º, V).
          </li>
          <li>
            Enviar e-mails do sistema, como convites, redefinição de senha,
            lembretes e documentos enviados pela empresa contratante.
          </li>
          <li>
            Garantir a segurança, prevenir abuso e corrigir erros (legítimo
            interesse, art. 7º, IX).
          </li>
          <li>Cumprir obrigações legais e regulatórias (art. 7º, II).</li>
        </ul>
        <p>Não vendemos dados pessoais e não os usamos para publicidade.</p>
      </LegalSection>

      <LegalSection id="operadores" title="4. Com quem compartilhamos">
        <p>
          Usamos fornecedores (suboperadores) que tratam dados apenas para
          viabilizar o serviço:
        </p>
        <ul>
          <li>
            <strong>Vercel</strong>: hospedagem da aplicação (Estados Unidos e
            rede global).
          </li>
          <li>
            <strong>Supabase</strong>: banco de dados, autenticação e
            armazenamento de arquivos. Região: <LegalValue field="dataRegion" />
            .
          </li>
          <li>
            <strong>Resend</strong>: envio de e-mails (Estados Unidos).
          </li>
          <li>
            <strong>OpenRouter</strong> e o provedor do modelo de IA: recursos
            de inteligência artificial, apenas com provedores que não retêm os
            dados nem os usam para treinamento (Estados Unidos).
          </li>
          <li>
            <strong>Sentry</strong>: registro de erros da aplicação (Estados
            Unidos).
          </li>
          <li>
            <strong>Meta (Instagram) e LinkedIn</strong>: somente quando a
            empresa contratante conecta essas contas para publicação.
          </li>
        </ul>
        <p>
          Também podemos compartilhar dados quando exigido por lei ou ordem
          judicial.
        </p>
      </LegalSection>

      <LegalSection id="internacional" title="5. Transferência internacional">
        <p>
          Parte dos fornecedores está fora do Brasil. Essas transferências
          ocorrem para a execução do contrato e com fornecedores que adotam
          cláusulas contratuais e medidas de segurança compatíveis com a LGPD
          (art. 33).
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies">
        <p>
          Usamos apenas cookies necessários para o funcionamento: a sessão de
          login e a empresa ativa selecionada. As métricas de uso e desempenho
          (Vercel Analytics e Speed Insights) são agregadas e não usam cookies
          de rastreamento. Não usamos cookies de publicidade.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="7. Segurança">
        <ul>
          <li>Conexões criptografadas (HTTPS) e senhas guardadas como hash.</li>
          <li>
            Isolamento por empresa no banco de dados: cada empresa só acessa os
            próprios dados (Row Level Security).
          </li>
          <li>
            Anexos e mídias ficam em armazenamento privado, acessados por links
            temporários (apenas o logotipo da marca é público). Documentos
            enviados a clientes usam links com prazo de validade.
          </li>
          <li>Limite de tentativas de login e de redefinição de senha.</li>
        </ul>
        <p>
          Em caso de incidente de segurança que possa causar risco relevante,
          avisaremos as empresas afetadas e a ANPD, conforme a LGPD.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="8. Por quanto tempo guardamos">
        <p>
          Os dados ficam guardados enquanto a conta estiver ativa. Após o
          cancelamento, ficam disponíveis para exportação por 30 dias e depois
          são excluídos, salvo quando a lei exigir guarda por mais tempo.
          Registros de erro e de segurança são mantidos por período limitado.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="9. Seus direitos">
        <p>
          O titular pode pedir confirmação do tratamento, acesso, correção,
          anonimização, portabilidade, eliminação, informação sobre
          compartilhamento e revisão de decisões automatizadas (art. 18).
        </p>
        <ul>
          <li>
            Se seus dados foram cadastrados por uma empresa que usa o {product}{" "}
            (por exemplo, você é cliente ou lead de uma agência), faça o pedido
            a essa empresa; nós a apoiaremos no atendimento.
          </li>
          <li>
            Se você é usuário do {product}, fale diretamente com o nosso
            encarregado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="contato" title="10. Encarregado (DPO) e contato">
        <p>
          Encarregado pelo tratamento de dados: <LegalValue field="dpoEmail" />.
          Endereço: <LegalValue field="address" />.
        </p>
        <p>
          Esta Política pode ser atualizada; a versão vigente fica sempre nesta
          página, com a data de atualização.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
