package com.shopcloud.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccesoTiendaException.class)
    public ProblemDetail manejarAccesoTienda(AccesoTiendaException ex, HttpServletRequest request) {
        ProblemDetail problem = crearProblemDetail(
                ex.getStatus(), "Tienda no disponible para esta operación", ex.getMessage(), request);
        problem.setProperty("codigo", ex.getCodigo());
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail manejarAccesoDenegadoSeguridad(AccessDeniedException ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.FORBIDDEN, "Acceso denegado",
                "No tiene permisos para realizar esta operación", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail manejarAutenticacion(AuthenticationException ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.UNAUTHORIZED, "Credenciales inválidas",
                "Correo electrónico o contraseña incorrectos", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail manejarIntegridad(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Violación de integridad en {}: {}", request.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return crearProblemDetail(HttpStatus.CONFLICT, "Conflicto de datos",
                "La operación entra en conflicto con datos existentes", request);
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            MissingRequestHeaderException.class
    })
    public ProblemDetail manejarParametroInvalido(Exception ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.BAD_REQUEST, "Solicitud inválida",
                "Falta un parámetro obligatorio o su formato es incorrecto", request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail manejarRutaInexistente(NoResourceFoundException ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.NOT_FOUND, "Recurso no encontrado",
                "La ruta solicitada no existe", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail manejarTipoNoSoportado(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Tipo de contenido no soportado",
                "El cuerpo de la petición debe enviarse como JSON", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail manejarMetodoNoPermitido(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return crearProblemDetail(HttpStatus.METHOD_NOT_ALLOWED, "Método no permitido",
                "El método HTTP no está disponible para esta ruta", request);
    }
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ProblemDetail manejarRecursoNoEncontrado(
            RecursoNoEncontradoException ex,
            HttpServletRequest request
    ) {

        return crearProblemDetail(
                HttpStatus.NOT_FOUND,
                "Recurso no encontrado",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ProblemDetail manejarReglaNegocio(
            ReglaNegocioException ex,
            HttpServletRequest request
    ) {

        ProblemDetail problem = crearProblemDetail(
                HttpStatus.CONFLICT,
                "Regla de negocio",
                ex.getMessage(),
                request
        );
        if (ex.getCodigo() != null) {
            problem.setProperty("codigo", ex.getCodigo());
        }
        return problem;
    }

    @ExceptionHandler(AccesoDenegadoException.class)
    public ProblemDetail manejarAccesoDenegado(
            AccesoDenegadoException ex,
            HttpServletRequest request
    ) {

        return crearProblemDetail(
                HttpStatus.FORBIDDEN,
                "Acceso denegado",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail manejarCredencialesInvalidas(
            BadCredentialsException ex,
            HttpServletRequest request
    ) {

        return crearProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Credenciales inválidas",
                "Correo electrónico o contraseña incorrectos",
                request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail manejarValidacion(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        ProblemDetail problem =
                crearProblemDetail(
                        HttpStatus.BAD_REQUEST,
                        "Error de validación",
                        "Uno o más campos contienen errores",
                        request
                );

        Map<String, String> errores =
                new LinkedHashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errores.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        problem.setProperty("errores", errores);

        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail manejarJsonInvalido(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {

        return crearProblemDetail(
                HttpStatus.BAD_REQUEST,
                "Solicitud inválida",
                "El cuerpo JSON no es válido o contiene valores incorrectos",
                request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail manejarIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {

        return crearProblemDetail(
                HttpStatus.BAD_REQUEST,
                "Solicitud inválida",
                ex.getMessage(),
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail manejarErrorGeneral(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Error no controlado en {}", request.getRequestURI(), ex);
        return crearProblemDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Error interno",
                "Ocurrió un error inesperado en el servidor",
                request
        );
    }

    private ProblemDetail crearProblemDetail(
            HttpStatus status,
            String titulo,
            String detalle,
            HttpServletRequest request
    ) {

        ProblemDetail problem =
                ProblemDetail.forStatusAndDetail(
                        status,
                        detalle
                );

        problem.setTitle(titulo);

        problem.setInstance(
                URI.create(request.getRequestURI())
        );

        return problem;
    }
}