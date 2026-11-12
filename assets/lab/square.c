#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

uint16_t rootf(uint16_t input) {
    uint16_t accumulator = 0;
    uint16_t extracted = 0;
    int16_t bitDepth =7;
    
    while (bitDepth >= 0) {
        // vadi bitove
        extracted = (extracted << 2) | ((input >> (bitDepth * 2)) & 0b011);
        //ovo je sub
        uint16_t sub = (accumulator << 2) | 1;
        
        if (extracted >= sub) {
            extracted -= sub;
            accumulator = (accumulator << 1) | 1;
        } else {
            accumulator <<= 1;
        }
        
        bitDepth--;
    }
    
    return accumulator;
}


int main() {
    int i =0;
    for(i=0;i<256;i++){
        
        short result = rootf(i);
        printf("Integer square root of %d is %d\n", i, result);
    }
    
    return 0;
}
