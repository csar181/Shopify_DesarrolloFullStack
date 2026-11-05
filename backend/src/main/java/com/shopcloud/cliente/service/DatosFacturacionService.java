package com.shopcloud.cliente.service;

import com.shopcloud.cliente.dto.DatosFacturacionDTO;
import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.entity.DatosFacturacion;
import com.shopcloud.cliente.repository.DatosFacturacionRepository;
import com.shopcloud.exception.RecursoNoEncontradoException;
import com.shopcloud.exception.ReglaNegocioException;
import com.shopcloud.pedido.entity.Pedido;
import com.shopcloud.pedido.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Datos reutilizables del cliente. Boleta: DNI y nombre completo. Factura: RUC y
 * razón social. Los comprobantes son simulados; no hay integración con SUNAT.
 */
@Service
@RequiredArgsConstructor
public class DatosFacturacionService {

    private final DatosFacturacionRepository datosRepository;
    private final PedidoRepository pedidoRepository;
    private final ClienteService clienteService;

    @Transactional(readOnly = true)
    public List<DatosFacturacionDTO> listar() {
        return datosRepository
                .findByClienteIdOrderByActualizadoEnDesc(clienteService.obtenerClienteActual().getId())
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    @Transactional
    public DatosFacturacionDTO crear(DatosFacturacionDTO dto) {
        String tipo = normalizarTipo(dto.getTipoDocumento());
        String numero = dto.getNumeroDocumento().trim();
        validarDocumento(tipo, numero);

        Cliente cliente = clienteService.obtenerClienteActual();

        if (datosRepository.findFirstByClienteIdAndTipoDocumentoAndNumeroDocumento(
                cliente.getId(), tipo, numero).isPresent()) {
            throw new ReglaNegocioException("Ya tiene registrado este documento");
        }

        return convertirDTO(datosRepository.save(
                DatosFacturacion.builder()
                        .tienda(cliente.getTienda())
                        .cliente(cliente)
                        .tipoDocumento(tipo)
                        .numeroDocumento(numero)
                        .nombreRazonSocial(dto.getNombreRazonSocial().trim())
                        .direccionFiscal(dto.getDireccionFiscal())
                        .build()
        ));
    }

    @Transactional
    public DatosFacturacionDTO actualizar(Long id, DatosFacturacionDTO dto) {
        DatosFacturacion datos = buscarPropios(id, clienteService.obtenerClienteActual());
        String tipo = normalizarTipo(dto.getTipoDocumento());
        String numero = dto.getNumeroDocumento().trim();
        validarDocumento(tipo, numero);

        datos.setTipoDocumento(tipo);
        datos.setNumeroDocumento(numero);
        datos.setNombreRazonSocial(dto.getNombreRazonSocial().trim());
        datos.setDireccionFiscal(dto.getDireccionFiscal());

        return convertirDTO(datosRepository.save(datos));
    }

    @Transactional
    public void eliminar(Long id) {
        DatosFacturacion datos = buscarPropios(id, clienteService.obtenerClienteActual());

        if (pedidoRepository.existsByDatosFacturacionId(datos.getId())) {
            throw new ReglaNegocioException(
                    "No se pueden eliminar datos de facturación utilizados en un pedido");
        }
        datosRepository.delete(datos);
    }

    /**
     * Determina los datos del comprobante de una compra: datos ya guardados o datos
     * nuevos, que se guardan salvo que el cliente indique lo contrario.
     */
    @Transactional
    public DatosComprobante resolverParaCheckout(
            Cliente cliente,
            String tipoComprobanteSolicitado,
            Long datosFacturacionId,
            String numeroDocumento,
            String nombreRazonSocial,
            String direccionFiscal,
            Boolean guardar
    ) {
        String tipoComprobante = normalizarComprobante(tipoComprobanteSolicitado);
        String tipoDocumento = Pedido.COMPROBANTE_FACTURA.equals(tipoComprobante)
                ? DatosFacturacion.TIPO_RUC
                : DatosFacturacion.TIPO_DNI;

        if (datosFacturacionId != null) {
            DatosFacturacion datos = buscarPropios(datosFacturacionId, cliente);

            if (!tipoDocumento.equals(datos.getTipoDocumento())) {
                throw new ReglaNegocioException(
                        "Una " + tipoComprobante.toLowerCase() + " requiere " + tipoDocumento);
            }
            return new DatosComprobante(
                    tipoComprobante, tipoDocumento, datos.getNumeroDocumento(),
                    datos.getNombreRazonSocial(), datos.getDireccionFiscal(), datos);
        }

        if (numeroDocumento == null || numeroDocumento.isBlank()
                || nombreRazonSocial == null || nombreRazonSocial.isBlank()) {
            throw new IllegalArgumentException(
                    Pedido.COMPROBANTE_FACTURA.equals(tipoComprobante)
                            ? "La factura requiere RUC y razón social"
                            : "La boleta requiere DNI y nombre completo");
        }

        String numero = numeroDocumento.trim();
        String nombre = nombreRazonSocial.trim();
        validarDocumento(tipoDocumento, numero);

        DatosFacturacion guardados = Boolean.FALSE.equals(guardar)
                ? null
                : guardarOActualizar(cliente, tipoDocumento, numero, nombre, direccionFiscal);

        return new DatosComprobante(
                tipoComprobante, tipoDocumento, numero, nombre, direccionFiscal, guardados);
    }

    private DatosFacturacion guardarOActualizar(
            Cliente cliente, String tipo, String numero, String nombre, String direccionFiscal
    ) {
        DatosFacturacion datos = datosRepository
                .findFirstByClienteIdAndTipoDocumentoAndNumeroDocumento(cliente.getId(), tipo, numero)
                .orElseGet(() -> DatosFacturacion.builder()
                        .tienda(cliente.getTienda())
                        .cliente(cliente)
                        .tipoDocumento(tipo)
                        .numeroDocumento(numero)
                        .build());

        datos.setNombreRazonSocial(nombre);
        datos.setDireccionFiscal(direccionFiscal);
        return datosRepository.save(datos);
    }

    private DatosFacturacion buscarPropios(Long id, Cliente cliente) {
        return datosRepository.findByIdAndClienteId(id, cliente.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Datos de facturación no encontrados"));
    }

    private String normalizarComprobante(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return Pedido.COMPROBANTE_BOLETA;
        }
        String normalizado = tipo.trim().toUpperCase();
        if (!Pedido.COMPROBANTE_BOLETA.equals(normalizado)
                && !Pedido.COMPROBANTE_FACTURA.equals(normalizado)) {
            throw new IllegalArgumentException("El comprobante debe ser BOLETA o FACTURA");
        }
        return normalizado;
    }

    private String normalizarTipo(String tipo) {
        String normalizado = tipo.trim().toUpperCase();
        if (!DatosFacturacion.TIPO_DNI.equals(normalizado)
                && !DatosFacturacion.TIPO_RUC.equals(normalizado)) {
            throw new IllegalArgumentException("El tipo de documento debe ser DNI o RUC");
        }
        return normalizado;
    }

    private void validarDocumento(String tipo, String numero) {
        if (DatosFacturacion.TIPO_DNI.equals(tipo) && !numero.matches("\\d{8}")) {
            throw new IllegalArgumentException("El DNI debe tener 8 dígitos");
        }
        if (DatosFacturacion.TIPO_RUC.equals(tipo) && !numero.matches("\\d{11}")) {
            throw new IllegalArgumentException("El RUC debe tener 11 dígitos");
        }
    }

    private DatosFacturacionDTO convertirDTO(DatosFacturacion datos) {
        return DatosFacturacionDTO.builder()
                .id(datos.getId())
                .tipoDocumento(datos.getTipoDocumento())
                .numeroDocumento(datos.getNumeroDocumento())
                .nombreRazonSocial(datos.getNombreRazonSocial())
                .direccionFiscal(datos.getDireccionFiscal())
                .build();
    }
}
