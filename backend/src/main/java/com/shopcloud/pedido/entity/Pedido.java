package com.shopcloud.pedido.entity;

import com.shopcloud.cliente.entity.Cliente;
import com.shopcloud.cliente.entity.DatosFacturacion;
import com.shopcloud.cliente.entity.Direccion;
import com.shopcloud.descuento.entity.Descuento;
import com.shopcloud.tienda.entity.Tienda;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Conserva una fotografía de envío, descuento y comprobante para el historial. */
@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    public static final String ESTADO_PENDIENTE = "PENDIENTE";
    public static final String ESTADO_CONFIRMADO = "CONFIRMADO";
    public static final String ESTADO_PREPARANDO = "PREPARANDO";
    public static final String ESTADO_ENVIADO = "ENVIADO";
    public static final String ESTADO_ENTREGADO = "ENTREGADO";
    public static final String ESTADO_CANCELADO = "CANCELADO";

    public static final String COMPROBANTE_BOLETA = "BOLETA";
    public static final String COMPROBANTE_FACTURA = "FACTURA";
    public static final String COMPROBANTE_GENERADO = "GENERADO";
    public static final String COMPROBANTE_ANULADO = "ANULADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "direccion_id", nullable = false)
    private Direccion direccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "descuento_id")
    private Descuento descuento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "datos_facturacion_id")
    private DatosFacturacion datosFacturacion;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "monto_descuento", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoDescuento;

    @Column(name = "base_imponible", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseImponible;

    @Column(name = "porcentaje_igv", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeIgv;

    @Column(name = "monto_igv", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoIgv;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "envio_linea_direccion", nullable = false, length = 255)
    private String envioLineaDireccion;

    @Column(name = "envio_ciudad", nullable = false, length = 100)
    private String envioCiudad;

    @Column(name = "envio_distrito", length = 100)
    private String envioDistrito;

    @Column(name = "envio_departamento", length = 100)
    private String envioDepartamento;

    @Column(name = "envio_codigo_postal", length = 20)
    private String envioCodigoPostal;

    @Column(name = "envio_referencia", length = 255)
    private String envioReferencia;

    @Column(name = "codigo_descuento", length = 50)
    private String codigoDescuento;

    @Column(name = "tipo_descuento", length = 20)
    private String tipoDescuento;

    @Column(name = "valor_descuento", precision = 12, scale = 2)
    private BigDecimal valorDescuento;

    @Column(name = "tipo_comprobante", nullable = false, length = 20)
    private String tipoComprobante;

    @Column(name = "tipo_documento", length = 20)
    private String tipoDocumento;

    @Column(name = "numero_documento", length = 20)
    private String numeroDocumento;

    @Column(name = "nombre_razon_social", length = 150)
    private String nombreRazonSocial;

    @Column(name = "direccion_fiscal", length = 255)
    private String direccionFiscal;

    @Column(name = "numero_comprobante", length = 50)
    private String numeroComprobante;

    @Column(name = "estado_comprobante", nullable = false, length = 30)
    private String estadoComprobante;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();
        if (estadoComprobante == null) estadoComprobante = COMPROBANTE_GENERADO;
        if (creadoEn == null) creadoEn = ahora;
        actualizadoEn = ahora;
    }

    @PreUpdate
    protected void preUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}
