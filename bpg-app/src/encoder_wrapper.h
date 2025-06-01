#ifndef ENCODER_WRAPPER_H
#define ENCODER_WRAPPER_H

#include <string>

class EncoderWrapper {
public:
    EncoderWrapper();
    ~EncoderWrapper();

    bool encodeBPG(const std::string& inputFilename, const std::string& outputFilename, const std::string& options);
};

#endif // ENCODER_WRAPPER_H
