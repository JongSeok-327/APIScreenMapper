// NanumGothic 폰트의 base64 문자열
export const NanumGothicBase64 = 'AAEAAAAOAIAAAwBgRkZUTXxF...'; // 실제 base64 문자열은 매우 깁니다.

// 폰트 설정을 위한 헬퍼 함수
export const setupKoreanFont = (pdf: any) => {
    try {
        pdf.addFileToVFS('NanumGothic-Regular.ttf', NanumGothicBase64);
        pdf.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
        pdf.setFont('NanumGothic');
        return true;
    } catch (error) {
        console.warn('한글 폰트 설정 실패:', error);
        return false;
    }
}; 