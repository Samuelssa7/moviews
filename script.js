const BASE_URL_IMAGEM = 'https://image.tmdb.org/t/p/w500';

document.getElementById('btn-pesquisa').addEventListener('click', pesquisarNaAPI);

async function pesquisarNaAPI() {
    const termo = document.getElementById('input-pesquisa').value;
    const listaResultados = document.getElementById('lista-resultados');
    const tituloResultados = document.getElementById('titulo-resultados');

    if (termo === '') return alert("Digite algo!");

    listaResultados.innerHTML = '<div class="text-white">Pesquisando...</div>';
    tituloResultados.style.display = 'block';

    const respostaBusca = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${termo}`);
    const dadosBusca = await respostaBusca.json();

    listaResultados.innerHTML = '';

    if (dadosBusca.results.length === 0) {
        listaResultados.innerHTML = '<p class="text-white">Nada encontrado.</p>';
        return;
    }

    for (const item of dadosBusca.results) {
        if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;

        const urlDetalhes = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${API_KEY}&language=pt-BR&append_to_response=watch/providers,release_dates,content_ratings`;
        
        const respostaDetalhes = await fetch(urlDetalhes);
        const detalhe = await respostaDetalhes.json();

        criarCardSimplificado(detalhe, item.media_type);
    }
}

function criarCardSimplificado(dados, tipo) {
    const listaResultados = document.getElementById('lista-resultados');
    
    const imagem = dados.poster_path ? BASE_URL_IMAGEM + dados.poster_path : 'https://via.placeholder.com/200x300?text=Sem+Imagem';
    const titulo = dados.title || dados.name;
    const nota = dados.vote_average.toFixed(1);
    const sinopse = dados.overview || "Sinopse indisponível.";

    const dataBruta = dados.release_date || dados.first_air_date || '';
    const ano = dataBruta ? dataBruta.split('-')[0] : 'Ano desc.';

    let idade = 'N/A';
    
    if (tipo === 'movie' && dados.release_dates) {
        const lancamentosBr = dados.release_dates.results.find(r => r.iso_3166_1 === 'BR');
        if (lancamentosBr) {
            const info = lancamentosBr.release_dates.find(d => d.certification !== '');
            if (info) idade = info.certification;
        }
    } else if (tipo === 'tv' && dados.content_ratings) {
        const classificacaoBr = dados.content_ratings.results.find(r => r.iso_3166_1 === 'BR');
        if (classificacaoBr) idade = classificacaoBr.rating;
    }

    if (idade === 'L') idade = 'Livre';

    let htmlProvedores = '<span class="text-muted small">Não encontrado em streaming no Brasil.</span>';
    
    if (dados['watch/providers'] && dados['watch/providers'].results && dados['watch/providers'].results.BR) {
        const provedores = dados['watch/providers'].results.BR;
        
        if (provedores.flatrate) {
            htmlProvedores = provedores.flatrate.map(prov => 
                `<img src="${BASE_URL_IMAGEM}${prov.logo_path}" title="${prov.provider_name}" style="width: 40px; border-radius: 8px; margin-right: 8px;">`
            ).join('');
        }
    }

    listaResultados.innerHTML += `
        <div class="col">
            <div class="card-resultado">
                <img src="${imagem}" class="poster-resultado">
                <div class="info-filme w-100">
                    
                    <div class="d-flex justify-content-between align-items-start">
                        <h3 class="text-warning mb-1">${titulo}</h3>
                        <span class="badge bg-warning text-dark fs-6">
                            <i class="fas fa-star"></i> ${nota}
                        </span>
                    </div>

                    <div class="mb-3 mt-2">
                        <span class="badge bg-secondary me-2">${ano}</span>
                        <span class="badge border border-light text-light me-2">${idade}</span>
                    </div>

                    <p class="text-light opacity-75">${sinopse}</p>

                    <div class="mt-3 p-3 bg-dark bg-opacity-50 rounded">
                        <h6 class="text-uppercase text-muted small mb-2">Onde Assistir:</h6>
                        <div>${htmlProvedores}</div>
                    </div>

                </div>
            </div>
        </div>
    `;
}