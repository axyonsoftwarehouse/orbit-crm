import type { Metadata } from "next"
import Link from "next/link"
import {
  LegalPage,
  LegalSection,
  LegalValue,
} from "@/components/legal/legal-page"
import { LEGAL, LEGAL_PATHS } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Termos de uso",
}

export default function TermsPage() {
  const product = LEGAL.productName
  return (
    <LegalPage
      title="Termos de uso"
      intro={
        <>
          <p>
            Estes Termos regulam o uso do {product}, plataforma de gestão (CRM)
            oferecida por <LegalValue field="companyName" />, inscrita no CNPJ{" "}
            <LegalValue field="cnpj" />, com sede em{" "}
            <LegalValue field="address" /> (&quot;nós&quot;).
          </p>
          <p>
            Ao criar ou usar uma conta, você declara que leu e concorda com
            estes Termos e com a{" "}
            <Link href={LEGAL_PATHS.privacy} className="text-primary underline">
              Política de privacidade
            </Link>
            . Se você usa o {product} em nome de uma empresa, declara ter
            poderes para aceitá-los por ela.
          </p>
        </>
      }
    >
      <LegalSection id="definicoes" title="1. Definições">
        <ul>
          <li>
            <strong>Empresa contratante:</strong> a agência ou empresa que
            contrata o {product} e cadastra seus dados nele.
          </li>
          <li>
            <strong>Usuários:</strong> as pessoas da equipe da empresa
            contratante, com papel de owner (responsável pela conta), admin ou
            membro.
          </li>
          <li>
            <strong>Clientes finais:</strong> os clientes da empresa
            contratante, que podem acessar o Portal do cliente.
          </li>
          <li>
            <strong>Dados da empresa contratante:</strong> tudo o que a empresa
            contratante e seus usuários cadastram ou enviam (clientes, contatos,
            leads, projetos, tarefas, faturas, arquivos, posts etc.).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="servico" title="2. O serviço">
        <p>
          O {product} é oferecido como software por assinatura, acessado pela
          internet. Ele reúne gestão de clientes, leads, projetos, tarefas,
          horas, orçamentos, faturas, contratos, tickets, SEO, redes sociais,
          Portal do cliente e recursos de inteligência artificial.
        </p>
        <p>
          Podemos melhorar, alterar ou descontinuar funcionalidades. Mudanças
          que reduzam de forma relevante o serviço contratado serão avisadas com
          antecedência razoável.
        </p>
      </LegalSection>

      <LegalSection id="contas" title="3. Contas e acesso">
        <ul>
          <li>
            As contas são criadas por convite. O owner da empresa contratante é
            responsável por quem convida, pelos papéis atribuídos e por remover
            o acesso de quem sai da equipe.
          </li>
          <li>
            Cada usuário deve manter sua senha em sigilo e avisar-nos de
            qualquer uso não autorizado. Atividades feitas com a conta são de
            responsabilidade de seu titular e da empresa contratante.
          </li>
          <li>
            O acesso de clientes finais ao Portal do cliente é concedido pela
            empresa contratante, que responde por esse acesso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="planos" title="4. Planos, limites e pagamento">
        <ul>
          <li>
            Cada plano tem limites (por exemplo, número de clientes, projetos,
            posts por mês e armazenamento). Ao atingir um limite, novos
            cadastros daquele tipo ficam bloqueados até a troca de plano; nada
            do que já existe é apagado.
          </li>
          <li>
            A troca de plano é feita mediante solicitação ao nosso suporte.
          </li>
          <li>
            Preço, forma de pagamento, reajuste e período de cobrança são os
            definidos na proposta ou no pedido aceito pela empresa contratante.
          </li>
          <li>
            A falta de pagamento pode levar à suspensão do acesso, após aviso.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="uso" title="5. Uso aceitável">
        <p>Não é permitido usar o {product} para:</p>
        <ul>
          <li>
            violar leis, inclusive a LGPD e normas de proteção ao consumidor;
          </li>
          <li>
            enviar spam ou mensagens não solicitadas, ou cadastrar dados
            pessoais sem base legal;
          </li>
          <li>
            armazenar ou distribuir conteúdo ilícito, ofensivo ou que viole
            direitos de terceiros;
          </li>
          <li>
            tentar acessar dados de outras empresas, burlar limites ou testar a
            segurança da plataforma sem autorização por escrito;
          </li>
          <li>
            sobrecarregar o serviço de forma intencional ou automatizar acessos
            fora das funcionalidades oferecidas.
          </li>
        </ul>
        <p>
          Podemos suspender contas que violem estas regras, com aviso sempre que
          possível.
        </p>
      </LegalSection>

      <LegalSection id="dados" title="6. Dados da empresa contratante">
        <ul>
          <li>
            Os dados da empresa contratante pertencem a ela. Nós os tratamos
            apenas para prestar o serviço, conforme a{" "}
            <Link href={LEGAL_PATHS.privacy} className="text-primary underline">
              Política de privacidade
            </Link>
            .
          </li>
          <li>
            Em relação aos dados pessoais de clientes, contatos e leads, a
            empresa contratante é a <strong>controladora</strong> e nós somos{" "}
            <strong>operadores</strong> (art. 5º da LGPD). Cabe à empresa
            contratante ter base legal para esses dados e atender os pedidos dos
            titulares; nós a apoiamos no que estiver ao nosso alcance.
          </li>
          <li>
            A empresa contratante pode exportar seus dados a qualquer momento em
            Exportar (CSV), dentro do aplicativo.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ia" title="7. Recursos de inteligência artificial">
        <p>
          Alguns recursos usam modelos de IA de terceiros para gerar resumos e
          sugestões a partir dos dados cadastrados. As respostas podem conter
          erros e devem ser revisadas antes de qualquer uso. Usamos apenas
          provedores que não retêm nem usam os dados enviados para treinar
          modelos.
        </p>
      </LegalSection>

      <LegalSection id="redes" title="8. Integrações com redes sociais">
        <p>
          Ao conectar contas de redes sociais, a empresa contratante autoriza o{" "}
          {product} a publicar em seu nome, conforme os posts aprovados e
          agendados. O uso dessas redes também está sujeito aos termos de cada
          uma; falhas ou mudanças nas APIs delas podem impedir uma publicação.
        </p>
      </LegalSection>

      <LegalSection id="disponibilidade" title="9. Disponibilidade e backups">
        <p>
          Buscamos manter o serviço disponível de forma contínua, mas ele pode
          ter interrupções para manutenção ou por falhas de terceiros
          (hospedagem, banco de dados, e-mail). Mantemos cópias de segurança do
          banco de dados conforme a política do provedor de infraestrutura.
          Recomendamos que a empresa contratante exporte periodicamente os dados
          que considerar críticos.
        </p>
      </LegalSection>

      <LegalSection id="cancelamento" title="10. Cancelamento e exclusão">
        <ul>
          <li>
            A empresa contratante pode cancelar a assinatura a qualquer momento,
            conforme as condições da proposta aceita.
          </li>
          <li>
            Após o cancelamento, os dados ficam disponíveis para exportação por
            30 dias e depois são excluídos de forma definitiva, salvo obrigação
            legal de guarda. Cópias de segurança são sobrescritas no ciclo
            normal do provedor.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilidade" title="11. Responsabilidade">
        <ul>
          <li>
            O serviço é oferecido no estado em que se encontra. Não respondemos
            por decisões tomadas com base nos dados ou nas sugestões do sistema,
            nem por conteúdo cadastrado pela empresa contratante.
          </li>
          <li>
            Nossa responsabilidade total, em qualquer caso, fica limitada ao
            valor pago pela empresa contratante nos 12 meses anteriores ao fato,
            exceto nos casos em que a lei não permite essa limitação.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="alteracoes" title="12. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos. A versão vigente fica sempre nesta
          página, com a data de atualização. Mudanças relevantes serão avisadas
          pelo aplicativo ou por e-mail ao owner da conta.
        </p>
      </LegalSection>

      <LegalSection id="foro" title="13. Lei aplicável e foro">
        <p>
          Estes Termos seguem as leis do Brasil. Fica eleito o foro da comarca
          de <LegalValue field="forumCity" /> para resolver qualquer questão
          relacionada a eles.
        </p>
        <p>
          Dúvidas: <LegalValue field="dpoEmail" />.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
