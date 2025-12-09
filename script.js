// VARIÁVEIS GLOBAIS
const tabelaCorpo = document.getElementById('tabelaCorpo');
const totalGastoMensalElement = document.getElementById('totalGastoMensal');

// FUNÇÃO PRINCIPAL: Adicionar Novo Gasto
document.getElementById('formGasto').addEventListener('submit', function(e) {
    e.preventDefault();

    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);

    // 1. Geração da Data e Hora
    const dataHoraRegistro = new Date();
    const registroCompleto = formatarDataHora(dataHoraRegistro);

    const gasto = {
        descricao,
        valor: valor,
        dataRegistro: dataHoraRegistro.toISOString(),
        registroCompleto
    };

    // 2. Salva os dados e recarrega a tabela e o resumo
    salvarGasto(gasto);

    // 3. Limpa o formulário
    document.getElementById('formGasto').reset();

    // Recarrega tudo para incluir o novo item com o índice correto
    tabelaCorpo.innerHTML = '';
    carregarGastosIniciais();
    atualizarResumoMensal();
});

// FUNÇÕES DE UTILIDADE E PERSISTÊNCIA

// Adiciona uma linha visual na tabela, incluindo o botão de excluir
function adicionarLinhaNaTabela(gasto, indice) {
    const novaLinha = tabelaCorpo.insertRow();

    novaLinha.insertCell(0).textContent = gasto.descricao;
    novaLinha.insertCell(1).textContent = `R$ ${gasto.valor.toFixed(2).replace('.', ',')}`;
    novaLinha.insertCell(2).textContent = gasto.registroCompleto;

    // Célula de Ação e Botão Excluir
    const celulaAcao = novaLinha.insertCell(3);
    const botaoExcluir = document.createElement('button');
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.className = 'botao-excluir';

    botaoExcluir.dataset.indice = indice;

    botaoExcluir.addEventListener('click', function() {
        excluirGasto(parseInt(this.dataset.indice));
    });

    celulaAcao.appendChild(botaoExcluir);
}

// Formata a data e hora para o formato de exibição
function formatarDataHora(dataObj) {
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR');
    return `${dataFormatada} às ${horaFormatada}`;
}

// Salva o gasto no armazenamento local do navegador (persistência)
function salvarGasto(gasto) {
    let gastos = obterTodosGastos();
    gastos.push(gasto);
    localStorage.setItem('gastos', JSON.stringify(gastos));
}

// Obtém todos os gastos do armazenamento local, garantindo que o valor é um número
function obterTodosGastos() {
    const gastosRaw = JSON.parse(localStorage.getItem('gastos')) || [];

    return gastosRaw.map(g => ({
        ...g,
        valor: parseFloat(g.valor)
    }));
}

// FUNÇÃO DE EXCLUSÃO INDIVIDUAL
function excluirGasto(indiceParaExcluir) {
    const confirmacao = confirm("Tem certeza que deseja excluir este gasto?");

    if (confirmacao) {
        let gastos = obterTodosGastos();

        // 1. Remove o item da lista (Array) pelo índice
        gastos.splice(indiceParaExcluir, 1);

        // 2. Salva a nova lista sem o item excluído
        localStorage.setItem('gastos', JSON.stringify(gastos));

        // 3. Recarrega a Tabela e o Resumo
        tabelaCorpo.innerHTML = '';
        carregarGastosIniciais();
        atualizarResumoMensal();
        alert("Gasto excluído com sucesso.");
    }
}

// FUNÇÃO PARA RESETAR TODOS OS GASTOS
document.getElementById('resetGastos').addEventListener('click', function() {
    const confirmacao = confirm("ATENÇÃO: Você tem certeza que deseja APAGAR TODOS os seus gastos registrados? Esta ação é irreversível.");

    if (confirmacao) {
        localStorage.removeItem('gastos');
        tabelaCorpo.innerHTML = '';
        atualizarResumoMensal();
        alert("Todos os gastos foram resetados com sucesso. Por favor, adicione um novo gasto para começar.");
    }
});


// FUNÇÃO DE TOTALIZAÇÃO E RESUMO POR MÊS (Inclui o código para ver a opção de cada mês)
function atualizarResumoMensal() {
    const todosGastos = obterTodosGastos();
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();

    let totalMesAtual = 0;

    // Agrupa os gastos por Mês e Ano
    const resumoPorMes = todosGastos.reduce((acc, gasto) => {
        const dataGasto = new Date(gasto.dataRegistro);
        const chaveMesAno = `${dataGasto.getFullYear()}-${dataGasto.getMonth()}`;

        if (!acc[chaveMesAno]) {
            acc[chaveMesAno] = 0;
        }
        acc[chaveMesAno] += gasto.valor;
        return acc;
    }, {});

    // 1. Calcula o Total do Mês Atual
    const chaveAtual = `${anoAtual}-${mesAtual}`;
    totalMesAtual = resumoPorMes[chaveAtual] || 0;

    // 2. Exibe o total do mês atual formatado
    totalGastoMensalElement.textContent = `R$ ${totalMesAtual.toFixed(2).replace('.', ',')}`;

    // 3. Cria e exibe os resumos de todos os meses (opções de cada mês)
    const resumoSection = document.getElementById('resumo-mensal');
    // Remove todos os resumos de meses passados antes de recriar
    resumoSection.querySelectorAll('.resumo-mes-passado').forEach(el => el.remove());

    for (const chave in resumoPorMes) {
        // Pula o mês atual (chaveAtual), pois ele já tem um campo dedicado
        if (chaveAtual === chave) continue;

        const [ano, mes] = chave.split('-').map(Number);
        // Formata a data para exibir o nome do mês e o ano
        const nomeMes = new Date(ano, mes).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const total = resumoPorMes[chave].toFixed(2).replace('.', ',');

        const p = document.createElement('p');
        p.className = 'resumo-mes-passado';
        p.textContent = `Total Gasto em ${nomeMes}: R$ ${total}`;
        resumoSection.appendChild(p);
    }
}

// FUNÇÃO PARA CARREGAR E EXIBIR TODOS OS GASTOS NA TABELA
function carregarGastosIniciais() {
    const gastos = obterTodosGastos();

    gastos.forEach((gasto, indice) => {
        const dataObj = new Date(gasto.dataRegistro);

        if (isNaN(dataObj.getTime())) {
            gasto.registroCompleto = "Data de registro inválida (Sugestão: Resetar)";
        } else {
            gasto.registroCompleto = formatarDataHora(dataObj);
        }

        adicionarLinhaNaTabela(gasto, indice);
    });
}


// Inicialização: Carrega os gastos e o resumo ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarGastosIniciais();
    atualizarResumoMensal();
});