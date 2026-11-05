package com.shopcloud;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Con ddl-auto=validate, también comprueba que las entidades coinciden con el esquema. */
@SpringBootTest
@ActiveProfiles("it")
class ShopcloudApplicationTests {

    @Test
    void contextLoads() {
    }
}
