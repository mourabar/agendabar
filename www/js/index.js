	var phpFunctions = "http://85.10.228.20:600/functions.php";
	var utilizador = null;
	var connection = null;
	var curReuniao = null;
	var curIntervenientes = null;
	var isUpdating = false;
	var app = { initialize: function() { this.bindEvents(); }, bindEvents: function() { document.addEventListener('deviceready', this.onDeviceReady, false); }, onDeviceReady: deviceIsReady }
	
	$(document).ready(documentIsReady);
	
	function documentIsReady(e) { app.initialize(); }
	
	function deviceIsReady() {
		if(navigator.connection.type == Connection.NONE) {
			alert("Actual não possui nenhuma conexão à internet. Para poder usar a aplicação por favor ative os dados 3G ou conecte-se a uma rede WiFi.");	
			navigator.app.exitApp();
		}else{	
			$.get(phpFunctions, {operation:"user_active"}).done(userIsActive);
			$("#btIniciarSessao").click(userLogin);
			$("#agendarBT").click(function(e){ $("#agendar-reuniao-form")[0].reset(); })
			$("#saveReuniao").click(saveReuniao);
			$("#gotoContactosBT").click(loadContactos);		
			$("#confirmarCancelarReuniao").click(cancelarReuniao);
			$("#logout").click(function(e) { $.get(phpFunctions, {'operation':'user_logout'}, function(data){ alert(data); }); });
			$("#alterar-reuniao").click(prepararReuniaoParaEditar);
			$("#cancelarAlteracao").click(cancelarAgendamento);	
		}
	}
	
	function cancelarAgendamento(e) {
		isUpdating = false;
		carregarContactosDisponiveis();
		$("#agendar-reuniao-form").reset();
	}
	
	function cancelarReuniao(e) {
		$.get(phpFunctions, {'operation':'reunioes_eliminar', 'idreuniao':curReuniao.idreuniao }, function(data) {
			$("#detalhes").panel("close");	
			$.get(phpFunctions, {"operation":"reunioes_html"}, reunioesListFill);
		});	
	}
	
	function prepararReuniaoParaEditar(e) {
		isUpdating = true;
		$("#data-dia").val(curReuniao.dia_ymd[2]);
		$("#data-mes").val(curReuniao.dia_ymd[1]);
		$("#inicio-hora").val(curReuniao.inicio.split(":")[0]);
		$("#inicio-minuto").val(curReuniao.inicio.split(":")[1]);
		$("#fim-hora").val(curReuniao.fim.split(":")[0]);
		$("#fim-minuto").val(curReuniao.fim.split(":")[1]);
		$("#idsala").val(curReuniao.idsala);
		$("#descricao-reuniao").val(curReuniao.descricao);
		for(var i = 0; i < curIntervenientes.length; i++) {
			$("#intervenientes-reuniao option").each(function(index, element) {            
				if(curIntervenientes[i].idcontacto == $(this).attr("value"))
					$(this).attr("selected","selected");
				else
					$(this).removeAttr("selected");
			});			
		}
		$("select").selectmenu('refresh');
	}
	
	function loadContactos(event) {
		event.preventDefault();
		$.get(phpFunctions, {'operation':'contactos_listar_html', 'useremail':utilizador.email}, contactosListFill);
	}
	
	function contactosListFill(html) {
		$.mobile.changePage("#contactos");
		$("#contactosLista").empty();
		$("#contactosLista").html(html);
		$("#contactosLista").listview("refresh");
		$("#contactosLista li").bind("tap", contactoTapped);
	}
	
	function contactoTapped(contacto) {
	
		var idcontacto = $(this).find('.contactoId_app').text();
		
		$.mobile.loading( 'show', {text: 'A carregar detalhes deste contacto...', textVisible: true, theme: 'b', html: ""});
		
		$.get(phpFunctions, {'operation':'contactos_detalhe', 'idcontacto':idcontacto}, function(response) {
		
			
			var contacto = JSON.parse(response);
			
			$("#contacto_foto").css("background-image","url(" + contacto.foto + ")");
			$("#contacto_nome").html(contacto.nome);
			$("#contacto_cargo").html(contacto.cargo);
			$("#contacto_email").html(contacto.email);
			$("#contacto_telefone").html(contacto.telefone);
			
			$("#contacto_ligar").attr("href","tel:" + contacto.telefone);
			$("#contacto_mail").attr("href","mailto:" + contacto.email);
			
			$.mobile.loading('hide');
			
			$("#profile").panel("open");
		
		});
		
	}
	
	function saveReuniao(event) {
		event.preventDefault();
		var date = new Date();
		if(isUpdating == false)
			$.get(phpFunctions, {'operation':'reunioes_adicionar', 'reuniao':{
				'idutilizador':utilizador.idutilizador,
				'idsala':$("#idsala").val(),
				'dia':date.getFullYear() + '-' + $("#data-mes").val() + '-' +$("#data-dia").val(),
				'inicio':$("#inicio-hora").val() + ':' + $("#inicio-minuto").val() + ':00',
				'fim':$('#fim-hora').val() + ':' + $('#fim-minuto').val() + ':00',
				'descricao':$("#descricao-reuniao").val(),
				'intervenientes':$("#intervenientes-reuniao").val()
			}}, function(response) {
				if(response != -1) {
					$.mobile.changePage("#home");
					$.get(phpFunctions, {"operation":"reunioes_html"}, reunioesListFill);
				}
			});	
		else
			$.get(phpFunctions, {
				'operation':'reunioes_alterar','reuniao':{
					'idreuniao':curReuniao.idreuniao,
					'idutilizador':utilizador.idutilizador,
					'idsala':$("#idsala").val(),
					'dia':date.getFullYear() + '-' + $("#data-mes").val() + '-' +$("#data-dia").val(),
					'inicio':$("#inicio-hora").val() + ':' + $("#inicio-minuto").val() + ':00',
					'fim':$('#fim-hora').val() + ':' + $('#fim-minuto').val() + ':00',
					'descricao':$("#descricao-reuniao").val(),
					'intervenientes':$("#intervenientes-reuniao").val()
				}
			}, function(response){
				if(response != -1) {
					$.mobile.changePage("#home");
					$.get(phpFunctions, {"operation":"reunioes_html"}, reunioesListFill);
				}
			});
		isUpdating = false;
	}
	
	function carregarContactosDisponiveis() {
		$.get(phpFunctions, {'operation':'contactos_html', 'email':utilizador.email}, function(data) {
			$("#intervenientes-reuniao").empty();
			$("#intervenientes-reuniao").append(data);
			$("select").selectmenu('refresh');
		});
	}
	
	function reuniaoTaped(e) {
		
		var idreuniao = $(this).children(".app_reuniao_id").text();
		
		$.mobile.loading( 'show', {text: 'A carregar detalhes da reunião...', textVisible: true, theme: 'b', html: ""});
		
		$.get(phpFunctions, { 'operation':'reunioes_detalhe','idreuniao':idreuniao }, reuniaoDetalhe);
	
	}
	
	function reuniaoDetalhe(reuniao) {
		
		var intervenientesHTML = "";
		
		$.mobile.loading( 'hide', { text: 'A carregar detalhes da reunião...', textVisible: true, theme: 'b', html: "" });
		detalhes = JSON.parse(reuniao);
		curReuniao = detalhes.reuniao;
		curIntervenientes = detalhes.intervenientes;
		
		if(detalhes.owner.idutilizador == utilizador.idutilizador)
			$("#alterar-reuniao, #cancelar-reuniao").show();
		else
			$("#cancelar-reuniao, #alterar-reuniao").hide();
	
		$(".profile-picture").css("background-image","url(" + detalhes.owner.foto + ")");
		$("#owner").empty().html('<strong>' + detalhes.owner.nome + '</strong><br/>' + detalhes.owner.cargo);
		$("#data").empty().html(detalhes.reuniao.dia);
		$("#sala").empty().html(detalhes.sala.nome);
		$("#hora").empty().html('<strong>' + detalhes.reuniao.inicio + 'h / ' + detalhes.reuniao.fim + 'h</strong>');
		$("#descricao").empty().html(detalhes.reuniao.descricao);
		
		$(".intervenientes").empty();
		
		for(var i = 0; i < detalhes.intervenientes.length; i++) {
			if(detalhes.intervenientes[i].aproved == 1) intervenientesHTML = intervenientesHTML + '<div class="interveniente-picture" style="background-image:url(' + detalhes.intervenientes[i].foto + ')"></div>';
			if(detalhes.intervenientes[i].aproved == 0) intervenientesHTML = intervenientesHTML + '<div class="interveniente-picture" style="background-image:url(img/incognito.png)"></div>';	
		}
		
		if(intervenientesHTML == "")
			intervenientesHTML = "<p>Nenhum interveniente foi adicionado pelo utilizador que criou a reunião.</p>";
		
		$(".intervenientes").html(intervenientesHTML);
		
		$("#alterar-reuniao, #cancelar-reuniao").hide();
		
		if(detalhes.owner.email == utilizador.email) {
			$("#alterar-reuniao, #cancelar-reuniao").show();
		}
		
		$("#detalhes").panel("open");
	}
	
	function reunioesListFill(html) {
		$("#reunioesLista").html(html);
		$("#reunioesLista").listview("refresh");
		$("#reunioesLista li").bind("tap", reuniaoTaped);
	}
	
	function userIsActive(e) {
		if(e == -1) $.mobile.changePage("#login"); else {
			utilizador = JSON.parse(e);
			$.mobile.changePage("#home");
			$.get(phpFunctions, {"operation":"reunioes_html"}, reunioesListFill);
			carregarContactosDisponiveis();
		}	
	}
	
	function userLogin(e) {
		var get_email = $("#iptEmail").val();
		var get_password = $("#iptPassword").val();		
		if(get_email != "" && get_password != "" && connection == null)
			$.get(phpFunctions, {operation:"user_login", email:get_email, password:get_password}).done(function(loginStatus){			
				if(loginStatus != "") {
					utilizador = JSON.parse(loginStatus);
					$.mobile.changePage("#home");
					$.get(phpFunctions, {"operation":"reunioes_html"}, reunioesListFill);
					carregarContactosDisponiveis();
				}
			});
		else $("#semDados").popup("open");
	}