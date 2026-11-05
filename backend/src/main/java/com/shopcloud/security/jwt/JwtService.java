package com.shopcloud.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * El mismo correo puede existir en usuarios y en varias tiendas, así que el token
 * identifica la cuenta por tipo e ID, y no por correo.
 */
@Service
public class JwtService {

    public static final String CLAIM_TIPO = "tipo";
    public static final String CLAIM_TIENDA = "tiendaId";
    public static final String TIPO_USUARIO = "USUARIO";
    public static final String TIPO_CLIENTE = "CLIENTE";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String generarTokenUsuario(Long usuarioId) {
        return Jwts.builder()
                .claim(CLAIM_TIPO, TIPO_USUARIO)
                .subject(String.valueOf(usuarioId))
                .issuedAt(new Date())
                .expiration(calcularExpiracion())
                .signWith(getSigningKey())
                .compact();
    }

    public String generarTokenCliente(Long clienteId, Long tiendaId) {
        return Jwts.builder()
                .claim(CLAIM_TIPO, TIPO_CLIENTE)
                .claim(CLAIM_TIENDA, tiendaId)
                .subject(String.valueOf(clienteId))
                .issuedAt(new Date())
                .expiration(calcularExpiracion())
                .signWith(getSigningKey())
                .compact();
    }

    /** Verifica firma y expiración; lanza una excepción si el token no es válido. */
    public Claims validar(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Date calcularExpiracion() {
        return new Date(System.currentTimeMillis() + jwtExpiration);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}
